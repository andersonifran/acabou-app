import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push";

/**
 * Webhook do Supabase (Database Webhook na tabela `items`, eventos INSERT/UPDATE).
 *
 * Substitui o gatilho frágil do cliente (timer de 3s que morria quando o
 * celular era bloqueado). Agora o PRÓPRIO BANCO dispara este endpoint toda vez
 * que um item muda — então a notificação é enviada de forma 100% confiável,
 * no servidor, independente do estado do app de quem marcou.
 *
 * Notifica o DONO da casa quando OUTRA pessoa marca um item como
 * "acabou" / "está acabando".
 *
 * Segurança: exige o header x-webhook-secret == process.env.WEBHOOK_SECRET
 * (configurado no painel do Supabase ao criar o webhook).
 */
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
      .select("id, name, owner_id")
      .eq("id", record.house_id)
      .single();
    if (!house) {
      return NextResponse.json({ ok: true, skipped: "casa nao encontrada" });
    }

    // Quem marcou (changeStatus salva updated_by). Não notifica o próprio dono.
    const marker = record.updated_by ?? null;
    if (!marker || marker === house.owner_id) {
      return NextResponse.json({ ok: true, skipped: "marcador e o dono" });
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("user_id", marker)
      .maybeSingle();

    const userName = profile?.full_name?.split(" ")[0] ?? "Alguém";
    const statusText = newStatus === "acabou" ? "acabou" : "está acabando";
    const itemName = record.name ?? "um item";

    await sendPushToUser(admin, house.owner_id, {
      title: `🏠 ${house.name}`,
      body: `${userName} marcou "${itemName}" como "${statusText}"`,
      url: "/despensa",
      tag: `item-${house.id}-${record.id}`,
    });

    await admin.from("notifications").insert({
      user_id: house.owner_id,
      house_id: house.id,
      type: "item_change",
      title: `${house.name}`,
      body: `${userName} marcou "${itemName}" como "${statusText}"`,
      data: { item_name: itemName, new_status: newStatus, changed_by: marker },
    });

    return NextResponse.json({ ok: true, sent: true });
  } catch (err) {
    console.error("[Webhook item-changed] Erro:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
