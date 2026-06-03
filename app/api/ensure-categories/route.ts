import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, getAuthUser } from "@/lib/supabase/server";

/**
 * POST /api/ensure-categories
 * Garante que categorias existam no banco antes de inserir itens.
 * Recebe um array de { name, icon } e retorna mapa name -> id.
 * Usa service role para bypassa RLS (categories só tem SELECT público).
 */
export async function POST(req: NextRequest) {
  try {
    // Exige login — endpoint usa service role e grava em tabela GLOBAL,
    // então NÃO pode ficar aberto à internet.
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json() as {
      categories: { name: string; icon: string }[];
    };

    if (!body.categories || !Array.isArray(body.categories) || body.categories.length === 0) {
      return NextResponse.json({ error: "categories array required" }, { status: 400 });
    }

    // Sanitiza e limita (anti-abuso): no máx. 50 itens, nomes/ícones curtos.
    const categories = body.categories
      .slice(0, 50)
      .map((c) => ({
        name: String(c?.name ?? "").trim().slice(0, 40),
        icon: String(c?.icon ?? "").trim().slice(0, 8),
      }))
      .filter((c) => c.name.length > 0);

    if (categories.length === 0) {
      return NextResponse.json({ error: "categories array required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Busca todas as categorias existentes
    const { data: existing } = await admin
      .from("categories")
      .select("id, name");

    const existingMap: Record<string, string> = {};
    if (existing) {
      existing.forEach(c => { existingMap[c.name] = c.id; });
    }

    // Filtra as que precisam ser criadas
    const toCreate = categories.filter(c => !existingMap[c.name]);

    if (toCreate.length > 0) {
      const maxSort = existing ? existing.length + 1 : 8;
      const rows = toCreate.map((c, i) => ({
        name: c.name,
        icon: c.icon,
        sort_order: maxSort + i,
        is_default: false,
      }));

      const { data: created, error } = await admin
        .from("categories")
        .insert(rows)
        .select("id, name");

      if (error) {
        console.error("[ensure-categories] Insert error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (created) {
        created.forEach(c => { existingMap[c.name] = c.id; });
      }
    }

    return NextResponse.json({ categories: existingMap });
  } catch (err: any) {
    console.error("[ensure-categories] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
