import { NextRequest, NextResponse } from "next/server";

/**
 * PUT /api/categories/rename — ⛔ TEMPORARIAMENTE DESATIVADO
 *
 * Renomear uma categoria mexia na categoria GLOBAL (compartilhada por todas as
 * casas), o que mudava o nome para TODOS os usuários. Foi desativado até existir
 * "categoria personalizada por casa" (override por casa, do jeito certo).
 *
 * Importante: renomear/editar ITENS continua liberado normalmente — é um recurso
 * separado e por casa (não afeta ninguém além da própria casa).
 *
 * A lógica antiga está no histórico do git (commit anterior) para reativar
 * quando o recurso por-casa for implementado.
 */
export async function PUT(_req: NextRequest) {
  return NextResponse.json(
    { error: "Renomear categoria está temporariamente indisponível." },
    { status: 403 }
  );
}
