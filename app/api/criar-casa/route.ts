import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { userId, houseName, fullName, phone, propertyType } = await request.json();

    if (!userId || !houseName) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Atualiza profile
    await supabase
      .from("profiles")
      .upsert({
        user_id: userId,
        full_name: fullName ?? "",
        email: "",
        phone: phone ?? null,
      }, { onConflict: "user_id" });

    // Cria a casa
    const { data: house, error: houseError } = await supabase
      .from("houses")
      .insert({ name: houseName.trim(), owner_id: userId, property_type: propertyType ?? "casa" })
      .select()
      .single();

    if (houseError) throw houseError;

    // Adiciona dono como membro
    const { error: memberError } = await supabase
      .from("house_members")
      .insert({
        house_id: house.id,
        user_id: userId,
        role: "owner",
        status: "active",
      });

    if (memberError) throw memberError;

    return NextResponse.json({ success: true, houseId: house.id });
  } catch (err: any) {
    console.error("[criar-casa]", err);
    return NextResponse.json(
      { error: err.message ?? "Erro ao criar casa" },
      { status: 500 }
    );
  }
}
