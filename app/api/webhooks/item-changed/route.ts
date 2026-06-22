import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push";
import { locationEmoji } from "@/lib/locations";

/**
 * Webhook do Supabase (Database Webhook na tabela `items`, eventos INSERT/UPDATE).
 *
 * O PRÓPRIO BANCO dispara este endpoint quando um item muda → notificação
 * confiável, no servidor, independente do estado do app de quem marcou.
 *
 * Notifica TODOS os participantes ATIVOS do local (menos quem marcou) quando um
 * item vira "acabou" / "está acabando" — colaboração de verdade (a família toda
 * fica sincronizada), não só o dono.
 *
 * ANTI-ENXURRADA (coalescência): se a mesma pessoa marca vários itens em poucos
 * minutos, em vez de N notificações mandamos UMA que se atualiza
 * ("Maria marcou 3 itens em Empresa"). Conseguido via:
 *   • contagem do estado COMMITADO da tabela `items` (updated_by + janela) →
 *     número certo SEM contador incremental (imune a corrida de webhooks);
 *   • janela de COALESCE_MIN min: se já há notificação recente do MESMO marcador
 *     no MESMO local, ATUALIZA (não cria N linhas no sino); senão INSERE;
 *   • MESMA `tag` por (local, marcador) → o celular mostra UMA linha que troca,
 *     não uma pilha. Também protege contra corrida (o 2º push troca o 1º).
 *
 * Segurança: exige header x-webhook-secret == process.env.WEBHOOK_SECRET.
 */

const COALESCE_MIN = 5;
const SACOLINO_ICON = "/mascote/sacolino-alerta.png";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-webhook-secret");
  if (!secret || secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const record = payload?.record;
    const oldRecord = payload?.old_record;

    if (!record) {
      return NextResponse.json({ ok: true, skipped: "sem record" });
    }

    const newStatus = record.status;
    const oldStatus = oldRecord?.status ?? null;

    // Só interessa quando VIROU acabou/acabando (mudança real de status).
    if (newStatus !== "acabou" && newStatus !== "acabando") {
      return NextResponse.json({ ok: true, skipped: "status fora do alvo" });
    }
    if (newStatus === oldStatus) {
      return NextResponse.json({ ok: true, skipped: "status nao mudou" });
    }

    const admin = createAdminClient();

    const { data: house } = await admin
      .from("houses")
      .select("id, name, owner_id, property_type")
      .eq("id", record.house_id)
      .single();
    if (!house) {
      return NextResponse.json({ ok: true, skipped: "casa nao encontrada" });
    }

    // Quem marcou (changeStatus/createItem salvam updated_by).
    const marker = record.updated_by ?? null;
    if (!marker) {
      return NextResponse.json({ ok: true, skipped: "sem marcador" });
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("user_id", marker)
      .maybeSingle();

    // 1º nome do perfil — usado só como FALLBACK (convidado quase nunca preenche
    // o full_name → caía em "Alguém"). O nome bom vem do display_name do membro
    // (apelido que o DONO cadastrou), resolvido abaixo após buscar os membros.
    const fullFirst = (profile?.full_name ?? "").trim().split(/\s+/)[0] || "";
    const statusText = newStatus === "acabou" ? "acabou" : "está acabando";
    const itemName = record.name ?? "um item";
    const emoji = locationEmoji(house.property_type as string | null);
    const localName = house.name as string;
    const pushTitle = `${emoji} ${localName}`;
    const tag = `item-${house.id}-${marker}`; // MESMA tag por local+marcador

    // Destinatários: todos os membros ATIVOS do local, MENOS quem marcou.
    // (status="active" já exclui convidados congelados.) Trazemos display_name
    // pra resolver o NOME de quem marcou (o apelido que o dono deu ao membro).
    const { data: members } = await admin
      .from("house_members")
      .select("user_id, display_name")
      .eq("house_id", house.id)
      .eq("status", "active");

    // Nome de quem marcou: PREFERE o display_name do membro neste local (o dono
    // sempre define ao convidar) → senão 1º nome do perfil → senão "Alguém".
    const markerDisplay = (members ?? [])
      .find((m: { user_id: string; display_name: string | null }) => m.user_id === marker)
      ?.display_name?.trim();
    const userName = markerDisplay || fullFirst || "Alguém";

    const recipients = [
      ...new Set(
        (members ?? []).map((m: { user_id: string; display_name: string | null }) => m.user_id)
      ),
    ].filter((uid) => uid && uid !== marker);

    if (recipients.length === 0) {
      return NextResponse.json({ ok: true, skipped: "sem destinatarios" });
    }

    const windowStart = new Date(Date.now() - COALESCE_MIN * 60 * 1000).toISOString();

    // Quantos itens ESTE marcador deixou pendentes neste local na janela —
    // contado DIRETO da tabela `items` (estado já commitado, inclui o item que
    // disparou este webhook) → IMUNE A CORRIDA (sem contador incremental). Dois
    // webhooks simultâneos do mesmo marcador convergem pro número certo.
    const { count: burstCount } = await admin
      .from("items")
      .select("id", { count: "exact", head: true })
      .eq("house_id", house.id)
      .eq("updated_by", marker)
      .in("status", ["acabou", "acabando"])
      .gte("updated_at", windowStart);
    const n = burstCount && burstCount > 1 ? burstCount : 1;
    const body =
      n > 1
        ? `${userName} marcou ${n} itens em "${localName}"`
        : `${userName} marcou "${itemName}" como "${statusText}"`;

    let sent = 0;
    for (const uid of recipients) {
      // Pra não encher o sino de N linhas: se já há uma notificação recente
      // deste marcador neste local, ATUALIZA o texto; senão, INSERE uma nova.
      const { data: recents } = await admin
        .from("notifications")
        .select("id")
        .eq("user_id", uid)
        .eq("house_id", house.id)
        .eq("type", "item_change")
        .eq("data->>changed_by", marker)
        .gte("created_at", windowStart)
        .order("created_at", { ascending: false })
        .limit(1);
      const match = (recents ?? [])[0] as { id: string } | undefined;

      if (match) {
        const { error: updErr } = await admin
          .from("notifications")
          .update({
            body,
            read: false,
            data: { changed_by: marker, count: n, last_item: itemName },
          })
          .eq("id", match.id);
        if (updErr) console.error("[Webhook] Falha ao agrupar notificação:", uid, updErr.message);
      } else {
        const { error: insErr } = await admin.from("notifications").insert({
          user_id: uid,
          house_id: house.id,
          type: "item_change",
          title: localName,
          body,
          data: { changed_by: marker, count: n, last_item: itemName, new_status: newStatus },
        });
        if (insErr) console.error("[Webhook] Falha ao gravar notificação:", uid, insErr.message);
      }

      await sendPushToUser(admin, uid, {
        title: pushTitle,
        body,
        icon: SACOLINO_ICON,
        url: "/despensa",
        tag,
      });
      sent++;
    }

    return NextResponse.json({ ok: true, sent });
  } catch (err) {
    console.error("[Webhook item-changed] Erro:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
