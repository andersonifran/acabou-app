import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * POST /api/ensure-categories
 * Garante que categorias existam no banco antes de inserir itens.
 * Recebe um array de { name, icon } e retorna mapa name -> id.
 * Usa service role para bypassa RLS (categories só tem SELECT público).
 */
export async function POST(req: NextRequest) {
  try {
    const { categories } = await req.json() as {
      categories: { name: string; icon: string }[];
    };

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
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
