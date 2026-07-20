"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/appStore";
import { Header } from "@/components/layout/Header";
import { ItemEvent, RECURRENCE_LABELS, RecurrenceType, Profile } from "@/types";
import { statusLabelFor } from "@/lib/local-terms";
import { useItems } from "@/hooks/useItems";
import { useSubscription } from "@/hooks/useSubscription";
import { formatRelativeTime, getNextReminderDate } from "@/lib/utils";
import { Bell, BellRing, Trash2, Shield, FileText, ChevronRight, MessageSquareHeart, Clock, Smartphone, Download, Plus, Pencil, X, Check as CheckIcon, Share2, Lock, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { PremiumTeaser } from "@/components/shared/PremiumTeaser";
import { useRole } from "@/hooks/useRole";
import { ProfileAvatar } from "@/components/shared/ProfileAvatar";
import { ReminderTimePicker } from "@/components/shared/ReminderTimePicker";

export default function ConfiguracoesPage() {
  const router = useRouter();
  const supabase = createClient();
  const { currentHouse, items, reset, updateItem, setToast, setAddItemModalOpen, setInitialStatus, profileName: storeProfileName, profileAvatar: storeProfileAvatar, profileEmail: storeProfileEmail, profilePhone: storeProfilePhone, setProfile: setStoreProfile, setProfileContact: setStoreProfileContact } = useAppStore();
  const { isPaid } = useSubscription();
  const { renameItem, deleteItem } = useItems();
  const { isOwner, isMember, canAccessPlans } = useRole();
  const [activeTab, setActiveTab] = useState<"geral" | "historico" | "lembretes" | "notificacoes">("geral");
  const [history, setHistory] = useState<(ItemEvent & { profile?: any; item?: any })[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Perfil do usuário
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      // try/catch silencioso: rede ruim ("Failed to fetch") no getUser/select
      // NÃO pode virar unhandled rejection. Se falhar, a tela usa o que já está
      // cacheado no store (nome/email/telefone) e segue sem travar.
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoadingProfile(false);
          return;
        }
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();
        if (data) {
          setProfile(data as Profile);
          // Cacheia email/telefone no store → próxima abertura mostra na hora,
          // sem "fade-in". O reset() (logout) limpa, então não vaza entre contas.
          setStoreProfileContact((data as any).email ?? "", (data as any).phone ?? "");
        }
      } catch (e) {
        console.warn("[loadProfile] falhou (ignorado, usa cache):", e);
      } finally {
        setLoadingProfile(false);
      }
    }
    loadProfile();
  }, []);
  const [reminderEnabled, setReminderEnabled] = useState(currentHouse?.reminder_enabled ?? false);
  const [reminderTime, setReminderTime] = useState(currentHouse?.reminder_time ?? "18:00");
  const [savingReminder, setSavingReminder] = useState(false);
  const push = usePushNotifications();
  const pwa = usePWAInstall();

  // Lembretes: estados de edição
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  async function loadHistory() {
    if (historyLoaded || !currentHouse) return;
    setLoadingHistory(true);
    // try/catch/finally: rede ruim ("Failed to fetch") NÃO pode deixar o spinner
    // travado pra sempre nem virar unhandled rejection. finally sempre desliga.
    try {
      const { data } = await supabase
        .from("item_events")
        .select("*, profile:profiles(full_name), item:items(name)")
        .eq("house_id", currentHouse.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) setHistory(data as any);
      setHistoryLoaded(true);
    } catch (e) {
      setToast("Não consegui carregar o histórico. Tente de novo. 📶");
      console.warn("[loadHistory] falhou:", e);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function toggleRecurring(itemId: string, enabled: boolean, recurrenceType?: RecurrenceType) {
    // Captura o original ANTES (pra reverter em erro de rede).
    const before = useAppStore.getState().items.find((i) => i.id === itemId);

    const updates: any = { is_recurring: enabled };
    if (enabled && recurrenceType) {
      updates.recurrence_type = recurrenceType;
      updates.next_reminder_at = getNextReminderDate(recurrenceType).toISOString();
    }

    // Otimista: o switch responde NA HORA (feedback premium).
    updateItem(itemId, updates);

    // Captura TUDO (rede "Failed to fetch" + erro do banco) — antes estourava
    // como unhandled rejection. Em erro: reverte o switch e avisa o usuário.
    try {
      const { error } = await supabase.from("items").update(updates).eq("id", itemId);
      if (error) throw error;
    } catch (e) {
      if (before) {
        updateItem(itemId, {
          is_recurring: before.is_recurring,
          recurrence_type: before.recurrence_type,
          next_reminder_at: before.next_reminder_at,
        });
      }
      setToast("Sem conexão — não consegui salvar. Tente de novo. 📶");
      console.warn("[toggleRecurring] falhou:", e);
    }
  }

  async function saveReminderSettings(enabled: boolean, time: string) {
    if (!currentHouse) return;
    // Guarda o estado anterior (pra reverter se a rede cair).
    const prevEnabled = reminderEnabled;
    const prevTime = reminderTime;
    setSavingReminder(true);
    setReminderEnabled(enabled);
    setReminderTime(time);
    // Captura TUDO (rede "Failed to fetch" + erro do banco) — antes estourava
    // como unhandled rejection. Em erro: reverte o switch/horário e avisa.
    try {
      const { error } = await supabase
        .from("houses")
        .update({ reminder_enabled: enabled, reminder_time: time })
        .eq("id", currentHouse.id);
      if (error) throw error;
    } catch (e) {
      setReminderEnabled(prevEnabled);
      setReminderTime(prevTime);
      setToast("Sem conexão — não consegui salvar. Tente de novo. 📶");
      console.warn("[saveReminderSettings] falhou:", e);
    } finally {
      setSavingReminder(false);
    }
  }

  // Lembretes: funções de edição
  async function handleRenameItem(itemId: string) {
    const trimmed = editingName.trim();
    if (!trimmed) { setEditingItemId(null); return; }
    try {
      await renameItem(itemId, trimmed);
    } catch { /* reverted by hook */ }
    setEditingItemId(null);
    setEditingName("");
  }

  async function handleDeleteItemFromReminders(itemId: string) {
    try {
      await deleteItem(itemId);
    } catch (err) {
      console.error("Erro ao excluir item:", err);
    }
    setDeletingItemId(null);
  }

  // Adicionar item de lembrete = abre o MESMO AddItemModal do resto do app
  // (teclado inteligente: autocomplete + categoria automática). Fonte única de
  // verdade — nada de input cru duplicado aqui. Status "tem" (é um item da casa
  // que o usuário quer poder marcar como recorrente depois).
  function openAddReminderItem() {
    setInitialStatus("tem");
    setAddItemModalOpen(true);
  }

  const [deletingAccount, setDeletingAccount] = useState(false);

  async function handleDeleteAccount() {
    const msg = isOwner
      ? "Tem certeza que deseja excluir sua conta?\n\nTodos os seus dados, casas, itens e membros convidados serão removidos PERMANENTEMENTE.\n\nEssa ação não pode ser desfeita."
      : "Tem certeza que deseja excluir sua conta?\n\nVocê sairá de todas as casas que participa e seu perfil será removido PERMANENTEMENTE.\n\nEssa ação não pode ser desfeita.";
    if (!confirm(msg)) return;
    if (!confirm("ÚLTIMA CONFIRMAÇÃO: Excluir conta e todos os dados?")) return;

    setDeletingAccount(true);
    try {
      const res = await fetch("/api/excluir-conta", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erro ao excluir conta");
      }

      // Limpa tudo e redireciona
      await supabase.auth.signOut();
      reset();
      router.push("/");
      router.refresh();
    } catch (err: any) {
      alert(err.message ?? "Erro ao excluir conta. Tente novamente.");
      setDeletingAccount(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    reset();
    router.push("/login");
    router.refresh();
  }

  function eventLabel(event: any): string {
    const name = event.profile?.full_name?.split(" ")[0] ?? "Alguém";
    const item = event.item?.name ?? "item";
    switch (event.event_type) {
      case "status_changed":
        if (event.new_status === "acabou") return `${name} marcou ${item} como "Acabou"`;
        if (event.new_status === "acabando") return `${name} marcou ${item} como "Está acabando"`;
        if (event.new_status === "tem") return `${name} marcou ${item} como "${statusLabelFor("tem", (currentHouse as any)?.property_type)}"`;
        if (event.new_status === "comprar") return `${name} adicionou ${item} à lista`;
        return `${name} atualizou ${item}`;
      case "purchased":
        return `${name} comprou ${item}`;
      case "created":
        return `${name} adicionou ${item}`;
      default:
        return `${name} atualizou ${item}`;
    }
  }

  return (
    <div>
      <Header title="Configurações" showBack />

      {/* Abas */}
      <div className="sticky top-[57px] z-30 bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto flex">
          {[
            { key: "geral", label: "Geral", locked: false },
            { key: "notificacoes", label: "Notificações", locked: false },
            { key: "historico", label: "Histórico", locked: !isPaid },
            { key: "lembretes", label: "Lembretes", locked: !isPaid },
          ].map(({ key, label, locked }) => (
            <button
              key={key}
              onClick={() => {
                setActiveTab(key as any);
                // Só carrega o histórico real para quem é pago (free vê o teaser)
                if (key === "historico" && isPaid) loadHistory();
              }}
              className={cn(
                "flex-1 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-1",
                activeTab === key
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-gray-500"
              )}
            >
              {label}
              {locked && <Lock size={11} className="text-amber-500 shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Aba: Geral */}
        {activeTab === "geral" && (
          <div className="space-y-3">
            {/* Seção de Perfil com Foto */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex flex-col items-center text-center">
                {/* Usa o perfil cacheado no store → aparece NA HORA (sem
                    placeholder de 1s). O fetch atualiza email/telefone depois. */}
                <ProfileAvatar
                  avatarUrl={profile?.avatar_url ?? storeProfileAvatar ?? null}
                  fullName={profile?.full_name ?? storeProfileName ?? ""}
                  size="lg"
                  editable
                  onAvatarChange={(newUrl) => {
                    setProfile((prev) => prev ? { ...prev, avatar_url: newUrl } : prev);
                    // Atualiza o store também — senão o fallback ?? storeProfileAvatar
                    // re-mostra a foto antiga após remover.
                    setStoreProfile(storeProfileName, newUrl ?? "");
                  }}
                />
                <h2 className="font-bold text-gray-900 text-lg mt-3">
                  {profile?.full_name ?? storeProfileName ?? "..."}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">{profile?.email ?? storeProfileEmail ?? ""}</p>
                {(profile?.phone ?? storeProfilePhone) && (
                  <p className="text-xs text-gray-400 mt-0.5">{profile?.phone ?? storeProfilePhone}</p>
                )}
              </div>
            </div>

            {/* Instalar App (quando no navegador e ainda não instalou) */}
            {!pwa.isInstalled && (
              <button
                onClick={() => {
                  if (pwa.isInstallable) {
                    pwa.showInstallPrompt();
                  } else {
                    // iOS — mostra dica
                    alert("Para instalar: toque no ícone de Compartilhar (↑) no Safari e selecione \"Adicionar à Tela de Início\".");
                  }
                }}
                className="w-full flex items-center gap-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl px-5 py-4 hover:from-green-100 hover:to-emerald-100 transition-all mb-3"
              >
                <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shrink-0">
                  <Download size={20} className="text-white" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-green-800 text-sm">Instalar o Acabou?</p>
                  <p className="text-xs text-green-600 mt-0.5">Acesse direto da tela inicial, como um app nativo</p>
                </div>
              </button>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <ThemeToggle className="border-b border-gray-50" />
              {canAccessPlans && (
                <Link href="/planos" className="flex items-center justify-between px-5 py-4 border-b border-gray-50 hover:bg-gray-50">
                  <p className="font-medium text-gray-900 text-sm">Ver planos</p>
                  <ChevronRight size={18} className="text-gray-400" />
                </Link>
              )}
              <Link href="/feedback" className="flex items-center justify-between px-5 py-4 border-b border-gray-50 hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  <MessageSquareHeart size={16} className="text-green-500" />
                  <p className="font-medium text-gray-900 text-sm">Enviar feedback</p>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </Link>
              <button
                onClick={async () => {
                  const url = "https://www.acabouapp.com.br";
                  const text =
                    "Opa! Queria te indicar o *Acabou?* 🛒\n\n" +
                    "É um app gratuito pra lista de compras da família. " +
                    "Todo mundo da casa pode marcar o que acabou e a lista fica pronta automaticamente.\n\n" +
                    "Baixe na Play Store ou use direto no navegador:";
                  // Folha de compartilhamento NATIVA (WhatsApp, Instagram, Telegram,
                  // SMS…) quando o aparelho suporta — dentro do app Android abre a
                  // bandeja do sistema. O link é da landing (universal + com a nossa
                  // prévia premium/logo via opengraph-image; a landing já mostra o
                  // badge da Play). Fallback: WhatsApp Web (desktop sem Web Share).
                  const waFallback = () => {
                    const t = encodeURIComponent(`${text}\n${url}`);
                    window.open(`https://wa.me/?text=${t}`, "_blank");
                  };
                  if (typeof navigator !== "undefined" && navigator.share) {
                    try {
                      await navigator.share({ title: "Acabou?", text, url });
                    } catch (err: any) {
                      // AbortError = usuário cancelou de propósito → não faz nada.
                      if (err?.name !== "AbortError") waFallback();
                    }
                    return;
                  }
                  waFallback();
                }}
                className="w-full flex items-center justify-between px-5 py-4 border-b border-gray-50 hover:bg-gray-50 text-left"
              >
                <div className="flex items-center gap-2">
                  <Share2 size={16} className="text-green-500" />
                  <p className="font-medium text-gray-900 text-sm">Indicar para um amigo</p>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </button>
              <a
                href="https://play.google.com/store/apps/details?id=br.com.acabouapp.www.twa"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between px-5 py-4 border-b border-gray-50 hover:bg-gray-50 text-left"
              >
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-amber-400 fill-amber-400" />
                  <p className="font-medium text-gray-900 text-sm">Avaliar na Play Store</p>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </a>
              <button
                onClick={() => {
                  try { localStorage.removeItem("acabou_walkthrough_seen"); } catch {}
                  router.push("/home");
                }}
                className="w-full flex items-center justify-between px-5 py-4 border-b border-gray-50 hover:bg-gray-50 text-left"
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-green-500" />
                  <p className="font-medium text-gray-900 text-sm">Ver tutorial novamente</p>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </button>
              <Link href="/privacidade" className="flex items-center justify-between px-5 py-4 border-b border-gray-50 hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-gray-500" />
                  <p className="font-medium text-gray-900 text-sm">Política de Privacidade</p>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </Link>
              <Link href="/termos" className="flex items-center justify-between px-5 py-4 hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-gray-500" />
                  <p className="font-medium text-gray-900 text-sm">Termos de Uso</p>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </Link>
            </div>

            {/* Dono: pode sair da conta E excluir a conta */}
            {isOwner && (
              <>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors font-semibold text-sm"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Sair da conta
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-red-100 text-red-500 hover:bg-red-50 transition-colors font-medium text-sm disabled:opacity-50"
                >
                  {deletingAccount ? (
                    <><div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> Excluindo...</>
                  ) : (
                    <><Trash2 size={16} /> Excluir minha conta</>
                  )}
                </button>
                <p className="text-xs text-gray-400 text-center">
                  Ao excluir sua conta, todos os seus dados serão removidos permanentemente.
                </p>
              </>
            )}

            {/* Membro convidado: pode sair da conta E excluir a própria conta
                (Google exige que QUALQUER usuário consiga excluir os dados). */}
            {isMember && (
              <>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors font-semibold text-sm"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Sair da conta
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-red-100 text-red-500 hover:bg-red-50 transition-colors font-medium text-sm disabled:opacity-50"
                >
                  {deletingAccount ? (
                    <><div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> Excluindo...</>
                  ) : (
                    <><Trash2 size={16} /> Excluir minha conta</>
                  )}
                </button>
                <p className="text-xs text-gray-400 text-center">
                  Ao excluir sua conta, você sai de todas as casas e seu perfil é removido permanentemente.
                </p>
              </>
            )}

            {/* Confirmação de logout (feedback testadores) — compartilhada por dono e convidado */}
            {showLogoutConfirm && (
              <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center px-4">
                <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl">
                  <h3 className="font-bold text-gray-900 text-lg mb-1.5">Sair da conta?</h3>
                  <p className="text-gray-600 text-sm mb-5">Você precisará entrar de novo na próxima vez.</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowLogoutConfirm(false)}
                      className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors active:scale-[0.98]"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors active:scale-[0.98]"
                    >
                      Sair
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Aba: Notificações (push + lembrete diário) */}
        {activeTab === "notificacoes" && (
          <div className="space-y-4">
            {/* Push Notifications - GRÁTIS */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                  <Smartphone size={20} className="text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Notificações no celular</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Receba um alerta quando alguém da família marcar um item como acabou
                  </p>
                </div>
              </div>

              {push.isDenied ? (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <p className="text-xs text-red-700">
                    Notificações foram bloqueadas no navegador. Vá nas configurações do navegador para permitir.
                  </p>
                </div>
              ) : !push.isSupported ? (
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                  <p className="text-xs text-gray-500">
                    Seu navegador não suporta notificações push. Tente no Chrome ou Edge.
                  </p>
                </div>
              ) : push.isSubscribed ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm text-green-700 font-medium">Ativado</span>
                    </div>
                    <button
                      onClick={push.unsubscribe}
                      className="text-xs text-gray-500 underline hover:text-gray-700"
                    >
                      Desativar
                    </button>
                  </div>
                  <button
                    onClick={async (e) => {
                      const btn = e.currentTarget;
                      btn.disabled = true;
                      try {
                        const r = await fetch("/api/push/test", { method: "POST" });
                        const d = await r.json();
                        alert(d.message ?? (d.ok ? "Pronto! O Sacolino mandou um oi pro seu celular. 👋" : "Não consegui enviar — reative as notificações."));
                      } catch {
                        alert("Ops, não rolou agora. Tente de novo. 🙏");
                      } finally {
                        btn.disabled = false;
                      }
                    }}
                    className="w-full flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 active:scale-[0.98] transition-all disabled:opacity-60"
                  >
                    <img
                      src="/mascote/sacolino-acenando.png"
                      alt="Sacolino"
                      className="w-10 h-10 shrink-0 object-contain"
                    />
                    <span className="flex-1 text-left text-sm font-bold text-green-800">
                      Testar notificação
                    </span>
                    <span className="text-green-600 text-xl leading-none shrink-0">→</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={push.subscribe}
                  className="w-full py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors"
                >
                  Ativar notificações
                </button>
              )}

              {push.error && (
                <p className="text-xs text-red-500 mt-2">{push.error}</p>
              )}
            </div>

            {/* Lembrete diário - PAGO */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                  <Clock size={20} className="text-amber-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 text-sm">Lembrete diário</h3>
                    <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">Plano Família</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Receba um lembrete no horário que escolher para ir às compras
                  </p>
                </div>
              </div>

              {!isPaid ? (
                <Link
                  href="/planos"
                  className="block bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-xl p-3.5 hover:from-green-100 hover:to-emerald-100 transition-colors"
                >
                  <p className="text-xs text-green-800 leading-relaxed">
                    🔒 Receba um empurrãozinho no horário certo de ir às compras — só no <strong>Plano Família</strong>.
                  </p>
                  <span className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-green-700">
                    Assinar Plano Família →
                  </span>
                </Link>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Ativar lembrete</span>
                    <button
                      onClick={() => saveReminderSettings(!reminderEnabled, reminderTime)}
                      disabled={savingReminder}
                      className={cn(
                        // sem disabled:opacity → o toggle NÃO pisca quando você
                        // escolhe um horário (que dispara um save rápido).
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                        reminderEnabled ? "bg-green-600" : "bg-gray-200"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          reminderEnabled ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>

                  {reminderEnabled && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-gray-700">Horário do lembrete</span>
                      <ReminderTimePicker
                        value={reminderTime}
                        onChange={(v) => saveReminderSettings(true, v)}
                        disabled={savingReminder}
                      />
                    </div>
                  )}

                  {reminderEnabled && !push.isSubscribed && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                      <p className="text-xs text-amber-800">
                        ⚠️ Ative as notificações push acima para receber o lembrete no celular.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Aba: Histórico */}
        {activeTab === "historico" && (
          !isPaid ? (
            <PremiumTeaser
              emoji="📜"
              title="Histórico completo"
              subtitle="Veja tudo que já mudou na sua casa: quem marcou, quem comprou e quando. Nada se perde."
              benefits={[
                "Linha do tempo de tudo que acontece",
                "Saiba quem comprou cada item",
                "Veja o que mais acaba na sua casa",
              ]}
            />
          ) : (
            <div>
              {loadingHistory ? (
                <div className="py-12 flex justify-center">
                  <div className="w-8 h-8 animate-spin rounded-full border-2 border-gray-200 border-t-green-600" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p>Nenhuma atividade registrada.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                  {history.map((event) => (
                    <div key={event.id} className="px-4 py-3.5 flex items-center justify-between gap-3">
                      <p className="text-sm text-gray-700">{eventLabel(event)}</p>
                      <span className="text-xs text-gray-400 shrink-0">{formatRelativeTime(event.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        )}

        {/* Aba: Lembretes */}
        {activeTab === "lembretes" && (
          !isPaid ? (
            <PremiumTeaser
              emoji="🔁"
              title="Lembretes recorrentes"
              subtitle="Marque o que você repõe sempre (arroz, café, ração...) e o app te avisa na hora certa — antes de acabar."
              benefits={[
                "Nunca mais esqueça de repor o essencial",
                "Escolha a frequência: semanal, mensal e mais",
                "Avisos automáticos no seu celular",
              ]}
            />
          ) : (
            <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">
                Marque itens como recorrentes para receber lembretes automáticos.
              </p>
              {isPaid && (
                <button
                  onClick={openAddReminderItem}
                  className="shrink-0 ml-2 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition-colors active:scale-90"
                  aria-label="Adicionar item"
                >
                  <Plus size={18} />
                </button>
              )}
            </div>

            {/* Agrupado por categoria */}
            {(() => {
              const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
                const catName = item.category?.name ?? "Outros";
                const catIcon = item.category?.icon ?? "📦";
                const key = `${catIcon} ${catName}`;
                if (!acc[key]) acc[key] = [];
                acc[key].push(item);
                return acc;
              }, {});

              return Object.entries(grouped).map(([catLabel, catItems]) => (
                <div key={catLabel} className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
                    {catLabel}
                  </p>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
                    {catItems.map((item) => (
                      <div key={item.id} className="px-4 py-3">
                        {/* Confirmação de exclusão */}
                        {deletingItemId === item.id ? (
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-red-600">Excluir <strong>{item.name}</strong>?</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDeleteItemFromReminders(item.id)}
                                className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-red-600"
                              >
                                Sim, excluir
                              </button>
                              <button
                                onClick={() => setDeletingItemId(null)}
                                className="text-xs text-gray-500 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-100"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between gap-2">
                              {/* Nome — editável */}
                              {editingItemId === item.id ? (
                                <div className="flex items-center gap-1 flex-1 min-w-0">
                                  <input
                                    type="text"
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleRenameItem(item.id);
                                      if (e.key === "Escape") { setEditingItemId(null); setEditingName(""); }
                                    }}
                                    className="flex-1 min-w-0 bg-gray-50 border border-green-300 rounded-lg px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleRenameItem(item.id)}
                                    className="text-green-600 hover:text-green-700 p-1"
                                  >
                                    <CheckIcon size={16} />
                                  </button>
                                  <button
                                    onClick={() => { setEditingItemId(null); setEditingName(""); }}
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                                  {isPaid && (
                                    <div className="flex items-center gap-0.5 shrink-0">
                                      <button
                                        onClick={() => { setEditingItemId(item.id); setEditingName(item.name); }}
                                        className="text-gray-300 hover:text-green-600 p-1 transition-colors"
                                        title="Renomear"
                                      >
                                        <Pencil size={14} />
                                      </button>
                                      <button
                                        onClick={() => setDeletingItemId(item.id)}
                                        className="text-gray-300 hover:text-red-500 p-1 transition-colors"
                                        title="Excluir"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Toggle recorrente */}
                              <button
                                onClick={() => toggleRecurring(item.id, !item.is_recurring, item.recurrence_type as RecurrenceType)}
                                disabled={!isPaid}
                                className={cn(
                                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 shrink-0",
                                  item.is_recurring ? "bg-green-600" : "bg-gray-200"
                                )}
                              >
                                <span
                                  className={cn(
                                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                    item.is_recurring ? "translate-x-6" : "translate-x-1"
                                  )}
                                />
                              </button>
                            </div>

                            {/* Seletor de frequência */}
                            {item.is_recurring && (
                              <select
                                value={item.recurrence_type ?? "monthly"}
                                onChange={(e) =>
                                  toggleRecurring(item.id, true, e.target.value as RecurrenceType)
                                }
                                disabled={!isPaid}
                                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 mt-2"
                              >
                                {Object.entries(RECURRENCE_LABELS).map(([value, label]) => (
                                  <option key={value} value={value}>{label}</option>
                                ))}
                              </select>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}

            {items.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <BellRing size={40} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">Nenhum item na despensa ainda.</p>
                <p className="text-xs mt-1">Adicione itens pela Despensa ou pelo botão + acima.</p>
              </div>
            )}
            </div>
          )
        )}
      </div>
    </div>
  );
}
