import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * PUT /api/categories/rename
 * Renomeia uma categoria para o usuário premium.
 * Body: { categoryId: string, newName: string }
 * Requer autenticação + plano pago.
 */
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { categoryId, newName } = await req.json() as {
      categoryId: string;
      newName: string;
    };

    if (!categoryId || !newName?.trim()) {
      return NextResponse.json({ error: "categoryId e newName são obrigatórios" }, { status: 400 });
    }

    const trimmed = newName.trim();
    if (trimmed.length > 40) {
      return NextResponse.json({ error: "Nome deve ter no máximo 40 caracteres" }, { status: 400 });
    }

    // Verifica se o usuário tem plano pago
    const { data: member } = await supabase
      .from("house_members")
      .select("house_id, role, house:houses(plan)")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    const plan = (member?.house as any)?.plan;
    if (!member || !plan || plan === "free") {
      return NextResponse.json(
        { error: "Recurso disponível apenas para planos pagos" },
        { status: 403 }
      );
    }

    // Verifica se role é owner ou admin
    if (member.role !== "owner" && member.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas o dono ou admin pode renomear categorias" },
        { status: 403 }
      );
    }

    // Usa admin client para bypass RLS (categories não tem UPDATE policy)
    const admin = createAdminClient();

    // Verifica se a categoria existe
    const { data: cat } = await admin
      .from("categories")
      .select("id, name")
      .eq("id", categoryId)
      .single();

    if (!cat) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
    }

    // Verifica se já existe outra categoria com esse nome
    const { data: duplicate } = await admin
      .from("categories")
      .select("id")
      .eq("name", trimmed)
      .neq("id", categoryId)
      .limit(1);

    if (duplicate && duplicate.length > 0) {
      return NextResponse.json(
        { error: "Já existe uma categoria com esse nome" },
        { status: 409 }
      );
    }

    // Renomeia
    const { error } = await admin
      .from("categories")
      .update({ name: trimmed })
      .eq("id", categoryId);

    if (error) {
      console.error("[categories/rename] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, name: trimmed });
  } catch (err: any) {
    console.error("[categories/rename] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
