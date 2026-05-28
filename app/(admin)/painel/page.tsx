import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";

async function getMetrics(supabase: any) {
  const now = new Date();
  const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalUsers },
    { count: totalHouses },
    { count: activeHouses7 },
    { count: activeHouses30 },
    { count: freeHouses },
    { count: monthlyHouses },
    { count: yearlyHouses },
    { count: totalItems },
    { count: purchasedItems },
    { count: finishedSessions },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("houses").select("*", { count: "exact", head: true }),
    supabase.from("item_events").select("house_id", { count: "exact", head: true }).gte("created_at", last7),
    supabase.from("item_events").select("house_id", { count: "exact", head: true }).gte("created_at", last30),
    supabase.from("houses").select("*", { count: "exact", head: true }).eq("plan", "free"),
    supabase.from("houses").select("*", { count: "exact", head: true }).eq("plan", "monthly").eq("plan_status", "active"),
    supabase.from("houses").select("*", { count: "exact", head: true }).eq("plan", "yearly").eq("plan_status", "active"),
    supabase.from("items").select("*", { count: "exact", head: true }),
    supabase.from("item_events").select("*", { count: "exact", head: true }).eq("event_type", "purchased"),
    supabase.from("shopping_sessions").select("*", { count: "exact", head: true }).eq("status", "finished"),
  ]);

  const mrr = (monthlyHouses ?? 0) * 9.9 + (yearlyHouses ?? 0) * (79.9 / 12);

  const { data: topCategories } = await supabase
    .from("items")
    .select("category_id, categories(name)")
    .limit(1000);

  const catCount: Record<string, number> = {};
  topCategories?.forEach((item: any) => {
    const name = item.categories?.name ?? "?";
    catCount[name] = (catCount[name] ?? 0) + 1;
  });
  const sortedCats = Object.entries(catCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return {
    totalUsers: totalUsers ?? 0,
    totalHouses: totalHouses ?? 0,
    activeHouses7: activeHouses7 ?? 0,
    activeHouses30: activeHouses30 ?? 0,
    freeHouses: freeHouses ?? 0,
    monthlyHouses: monthlyHouses ?? 0,
    yearlyHouses: yearlyHouses ?? 0,
    totalItems: totalItems ?? 0,
    purchasedItems: purchasedItems ?? 0,
    finishedSessions: finishedSessions ?? 0,
    mrr: mrr.toFixed(2),
    topCategories: sortedCats,
  };
}

export default async function PainelPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());
  if (!adminEmails.includes(user.email ?? "")) redirect("/home");

  // Usa cliente admin (service role) para as métricas — bypassa RLS
  const adminSupabase = createAdminClient();
  const metrics = await getMetrics(adminSupabase);

  const statCards = [
    { label: "Usuários cadastrados", value: metrics.totalUsers, color: "bg-blue-50 text-blue-700" },
    { label: "Casas criadas", value: metrics.totalHouses, color: "bg-purple-50 text-purple-700" },
    { label: "Casas ativas (7d)", value: metrics.activeHouses7, color: "bg-green-50 text-green-700" },
    { label: "Casas ativas (30d)", value: metrics.activeHouses30, color: "bg-green-50 text-green-700" },
    { label: "Plano Grátis", value: metrics.freeHouses, color: "bg-gray-50 text-gray-700" },
    { label: "Plano Mensal", value: metrics.monthlyHouses, color: "bg-amber-50 text-amber-700" },
    { label: "Plano Anual", value: metrics.yearlyHouses, color: "bg-amber-50 text-amber-700" },
    { label: "MRR estimado", value: `R$ ${metrics.mrr}`, color: "bg-emerald-50 text-emerald-700" },
    { label: "Itens criados", value: metrics.totalItems, color: "bg-slate-50 text-slate-700" },
    { label: "Itens comprados", value: metrics.purchasedItems, color: "bg-green-50 text-green-700" },
    { label: "Compras finalizadas", value: metrics.finishedSessions, color: "bg-teal-50 text-teal-700" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Painel Admin — Acabou?</h1>
            <p className="text-sm text-gray-500">Métricas gerais do produto</p>
          </div>
          <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
            Admin
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6">
        {/* Cards de métricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {statCards.map(({ label, value, color }) => (
            <div key={label} className={`rounded-2xl p-4 ${color}`}>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs mt-1 opacity-70">{label}</p>
            </div>
          ))}
        </div>

        {/* Categorias mais usadas */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Categorias mais usadas</h2>
          <div className="space-y-3">
            {metrics.topCategories.map(([name, count]) => {
              const pct = Math.round((count / metrics.totalItems) * 100);
              return (
                <div key={name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium">{name}</span>
                    <span className="text-gray-500">{count} itens ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
