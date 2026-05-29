"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useHouse } from "@/hooks/useHouse";
import { useAppStore } from "@/store/appStore";
import { Header } from "@/components/layout/Header";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { generateInviteMessage, buildWhatsAppShareUrl } from "@/lib/utils";
import {
  Users, Crown, Shield, User, Share2, Copy, LogOut, Settings, Trash2,
  ChevronRight, X, Camera, Pencil, Check, Plus, MessageSquareHeart, UserMinus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MemberRole } from "@/types";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

const roleIcons: Record<MemberRole, React.ReactNode> = {
  owner: <Crown size={14} className="text-amber-500" />,
  admin: <Shield size={14} className="text-blue-500" />,
  member: <User size={14} className="text-gray-400" />,
};

const roleLabels: Record<MemberRole, string> = {
  owner: "Dono",
  admin: "Admin",
  member: "Membro",
};

const PROPERTY_TYPES = [
  { id: "casa",        label: "Casa",        icon: "🏠", hint: "Onde eu moro" },
  { id: "apartamento", label: "Apartamento", icon: "🏢", hint: "Meu apê" },
  { id: "praia",       label: "Praia",       icon: "🏖️", hint: "Casa de praia" },
  { id: "veraneio",    label: "Veraneio",    icon: "🌲", hint: "Sítio / campo" },
  { id: "empresa",     label: "Empresa",     icon: "💼", hint: "Meu trabalho" },
  { id: "outro",       label: "Outro",       icon: "📍", hint: "Outro lugar" },
];

const RELATIONS_FAMILIAR = ["Cônjuge", "Filho(a)", "Pai", "Mãe", "Irmão(ã)", "Avô(ó)", "Neto(a)", "Tio(a)", "Primo(a)", "Outro"];

export default function CasaPage() {
  const router = useRouter();
  const supabase = createClient();
  const { currentHouse, members, isPaid, generateInviteToken, getInviteUrl, removeMember } = useHouse();
  const { reset, setCurrentHouse, allHouses, setAllHouses, setMembers, dataSyncComplete } = useAppStore();

  const [inviteUrl, setInviteUrl] = useState("");
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // Perfil do usuário atual
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [profileName, setProfileName] = useState<string>("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edição do nome do perfil
  const [editingProfileName, setEditingProfileName] = useState(false);
  const [savingProfileName, setSavingProfileName] = useState(false);
  const profileNameInputRef = useRef<HTMLInputElement>(null);

  // Edição do nome da casa
  const [editingHouseName, setEditingHouseName] = useState(false);
  const [houseName, setHouseName] = useState("");
  const [savingHouseName, setSavingHouseName] = useState(false);
  const houseNameInputRef = useRef<HTMLInputElement>(null);

  // Excluir casa
  const [deletingHouse, setDeletingHouse] = useState(false);
  const [confirmDeleteHouse, setConfirmDeleteHouse] = useState(false);

  // Modal de convite
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteeName, setInviteeName] = useState("");
  const [memberType, setMemberType] = useState<"familiar" | "funcionario">("familiar");
  const [relationLabel, setRelationLabel] = useState("");

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        setProfileName(profile.full_name ?? "");
        setAvatarUrl((profile as any).avatar_url ?? "");
      }
    }
    loadUser();
  }, []);

  useEffect(() => {
    if (currentHouse) setHouseName(currentHouse.name);
  }, [currentHouse]);

  useEffect(() => {
    if (editingHouseName && houseNameInputRef.current) {
      houseNameInputRef.current.focus();
      houseNameInputRef.current.select();
    }
  }, [editingHouseName]);

  useEffect(() => {
    if (editingProfileName && profileNameInputRef.current) {
      profileNameInputRef.current.focus();
      profileNameInputRef.current.select();
    }
  }, [editingProfileName]);

  const propertyType = PROPERTY_TYPES.find(p => p.id === (currentHouse as any)?.property_type) ?? PROPERTY_TYPES[0];
  const isOwner = (currentHouse as any)?.owner_id === currentUserId;

  // Carrega membros diretamente do DB (mais confiável que store)
  const [dbMembers, setDbMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // Edição de membro (modal completo)
  const [editingMember, setEditingMember] = useState<any>(null);
  const [editMemberName, setEditMemberName] = useState("");
  const [editMemberType, setEditMemberType] = useState<"familiar" | "funcionario">("familiar");
  const [editMemberRelation, setEditMemberRelation] = useState("");
  const [savingMember, setSavingMember] = useState(false);

  // Membros existentes para convite rápido (Issue 2)
  const [existingMembers, setExistingMembers] = useState<any[]>([]);

  useEffect(() => {
    async function loadMembers() {
      if (!currentHouse) return;
      setLoadingMembers(true);
      try {
        // Query simples sem join problemático — busca membros ativos
        const { data, error } = await supabase
          .from("house_members")
          .select("*")
          .eq("house_id", currentHouse.id)
          .eq("status", "active");

        if (error) {
          console.error("[Casa] Erro ao buscar membros:", error);
          setLoadingMembers(false);
          return;
        }

        if (data && data.length > 0) {
          // Busca perfis separadamente (evita problema de RLS no join)
          const userIds = data.map((m: any) => m.user_id);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, full_name, email, avatar_url")
            .in("user_id", userIds);

          // Mescla perfis com membros
          const profileMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));
          const enriched = data.map((m: any) => ({
            ...m,
            profile: profileMap.get(m.user_id) ?? null,
          }));

          setDbMembers(enriched);
          setMembers(data as any);
        } else {
          setDbMembers(data ?? []);
        }
      } catch (err) {
        console.error("[Casa] Erro inesperado ao carregar membros:", err);
      }
      setLoadingMembers(false);
    }
    loadMembers();
  }, [currentHouse?.id]);

  const activeMembers = dbMembers;

  // ── UPLOAD DE FOTO ──────────────────────────────────────
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !currentUserId) return;

    // Valida tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Imagem muito grande. Use uma foto menor que 5MB.");
      return;
    }

    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const filePath = `${currentUserId}.${ext}`;

      // Faz upload para o bucket "avatars"
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      // Pega a URL pública
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Adiciona timestamp para forçar reload do cache
      const urlWithTs = `${publicUrl}?t=${Date.now()}`;

      // Atualiza perfil
      await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl } as any)
        .eq("user_id", currentUserId);

      setAvatarUrl(urlWithTs);
    } catch (err: any) {
      console.error(err);
      alert("Erro ao enviar foto. Tente novamente.");
    } finally {
      setUploadingAvatar(false);
      // Limpa o input para permitir re-seleção da mesma foto
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // ── EDITAR NOME DO PERFIL ────────────────────────────────
  async function handleSaveProfileName() {
    const trimmed = profileName.trim();
    if (!trimmed || !currentUserId) return;
    setSavingProfileName(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: trimmed })
        .eq("user_id", currentUserId);
      if (error) throw error;
      setEditingProfileName(false);
    } catch {
      alert("Erro ao salvar nome.");
    } finally {
      setSavingProfileName(false);
    }
  }

  // ── EXCLUIR CASA (somente dono) ────────────────────────
  async function handleDeleteHouse() {
    if (!currentHouse || !isOwner) return;
    // Não permite excluir se for a única casa
    if (allHouses.length <= 1) {
      alert("Você não pode excluir seu único local.");
      return;
    }
    setDeletingHouse(true);
    try {
      // Remove itens, eventos, membros e a casa
      await supabase.from("item_events").delete().eq("house_id", currentHouse.id);
      await supabase.from("items").delete().eq("house_id", currentHouse.id);
      await supabase.from("invite_tokens").delete().eq("house_id", currentHouse.id);
      await supabase.from("house_members").delete().eq("house_id", currentHouse.id);
      await supabase.from("subscriptions").delete().eq("house_id", currentHouse.id);
      await supabase.from("houses").delete().eq("id", currentHouse.id);

      // Atualiza lista e troca para outra casa
      const remaining = allHouses.filter(h => h.id !== currentHouse.id);
      setAllHouses(remaining);
      if (remaining.length > 0) {
        setCurrentHouse(remaining[0]);
        localStorage.setItem("acabou_selected_house", remaining[0].id);
      }
      setConfirmDeleteHouse(false);
      router.push("/home");
    } catch (err) {
      console.error("Erro ao excluir casa:", err);
      alert("Erro ao excluir local. Tente novamente.");
    } finally {
      setDeletingHouse(false);
    }
  }

  // ── REMOVER MEMBRO (somente dono) ─────────────────────
  async function handleRemoveMember(memberId: string, memberName: string) {
    if (!confirm(`Remover ${memberName} deste local?\n\nEle perderá acesso a este local imediatamente.`)) return;
    try {
      await removeMember(memberId);
      // Atualiza lista local
      setDbMembers(prev => prev.filter(m => m.id !== memberId));
    } catch {
      alert("Erro ao remover membro.");
    }
  }

  // ── ABRIR EDITOR DE MEMBRO ──────────────────────────────
  function openMemberEditor(member: any) {
    setEditingMember(member);
    setEditMemberName(member.display_name || member.profile?.full_name || "");
    setEditMemberType((member.member_type as any) || "familiar");
    setEditMemberRelation(member.relation_label || "");
  }

  // ── SALVAR EDIÇÃO DO MEMBRO ──────────────────────────────
  async function handleSaveMember() {
    if (!editingMember) return;
    setSavingMember(true);
    try {
      const updates: any = {
        display_name: editMemberName.trim() || null,
        member_type: editMemberType,
        relation_label: editMemberRelation || null,
      };
      const { error } = await supabase
        .from("house_members")
        .update(updates)
        .eq("id", editingMember.id);

      if (error) throw error;

      // Atualiza lista local
      setDbMembers(prev => prev.map(m =>
        m.id === editingMember.id ? { ...m, ...updates } : m
      ));
      setEditingMember(null);
    } catch (err) {
      console.error("Erro ao salvar membro:", err);
      alert("Erro ao salvar alterações. Tente novamente.");
    } finally {
      setSavingMember(false);
    }
  }

  // ── CARREGAR MEMBROS EXISTENTES (para convite rápido) ────
  async function loadExistingMembersForInvite() {
    if (!currentHouse || !isOwner) return;
    try {
      // Busca todos os membros de TODAS as casas do dono
      const ownerHouseIds = allHouses.map(h => h.id);
      const { data: allMembers } = await supabase
        .from("house_members")
        .select("user_id, display_name, member_type, relation_label")
        .in("house_id", ownerHouseIds)
        .eq("status", "active")
        .neq("user_id", currentUserId);

      if (!allMembers || allMembers.length === 0) { setExistingMembers([]); return; }

      // Remove duplicatas e filtra quem JÁ está nesta casa
      const currentMemberIds = new Set(dbMembers.map(m => m.user_id));
      const uniqueMap = new Map<string, any>();
      for (const m of allMembers) {
        if (!currentMemberIds.has(m.user_id) && !uniqueMap.has(m.user_id)) {
          uniqueMap.set(m.user_id, m);
        }
      }

      // Busca nomes/perfis
      const userIds = Array.from(uniqueMap.keys());
      if (userIds.length === 0) { setExistingMembers([]); return; }
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map((profiles ?? []).map(p => [p.user_id, p]));
      const enriched = userIds.map(uid => ({
        ...uniqueMap.get(uid),
        profile: profileMap.get(uid),
      }));
      setExistingMembers(enriched);
    } catch (err) {
      console.error("Erro ao carregar membros existentes:", err);
    }
  }

  // ── ADICIONAR MEMBRO EXISTENTE A ESTA CASA ──────────────
  async function handleAddExistingMember(userId: string, memberData: any) {
    if (!currentHouse) return;
    try {
      const { error } = await supabase
        .from("house_members")
        .insert({
          house_id: currentHouse.id,
          user_id: userId,
          role: "member",
          status: "active",
          invited_by: currentUserId,
          display_name: memberData.display_name,
          member_type: memberData.member_type,
          relation_label: memberData.relation_label,
        });

      if (error) throw error;

      // Recarrega membros
      setExistingMembers(prev => prev.filter(m => m.user_id !== userId));

      // Busca profile para adicionar à lista local
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, avatar_url")
        .eq("user_id", userId)
        .single();

      const newMember = {
        id: crypto.randomUUID(),
        house_id: currentHouse.id,
        user_id: userId,
        role: "member",
        status: "active",
        display_name: memberData.display_name,
        member_type: memberData.member_type,
        relation_label: memberData.relation_label,
        profile: profile,
      };
      setDbMembers(prev => [...prev, newMember]);

      alert(`${memberData.profile?.full_name || "Membro"} foi adicionado a ${currentHouse.name}!`);
    } catch (err: any) {
      if (err?.code === "23505") {
        alert("Este membro já está neste local.");
      } else {
        console.error("Erro ao adicionar membro:", err);
        alert("Erro ao adicionar membro. Tente novamente.");
      }
    }
  }

  // ── EDITAR NOME DA CASA ─────────────────────────────────
  async function handleSaveHouseName() {
    if (!houseName.trim() || !currentHouse) return;
    setSavingHouseName(true);
    try {
      const { error } = await supabase
        .from("houses")
        .update({ name: houseName.trim() })
        .eq("id", currentHouse.id);

      if (error) throw error;

      setCurrentHouse({ ...currentHouse, name: houseName.trim() });
      setEditingHouseName(false);
    } catch {
      alert("Erro ao salvar nome.");
    } finally {
      setSavingHouseName(false);
    }
  }

  // ── CONVITE ────────────────────────────────────────────
  async function handleGenerateInvite() {
    if (!inviteeName.trim()) { alert("Informe o nome da pessoa."); return; }
    if (!relationLabel) { alert(memberType === "familiar" ? "Informe o parentesco." : "Informe o cargo."); return; }

    setLoadingInvite(true);
    try {
      const token = await generateInviteToken();
      const url = getInviteUrl(token);

      await supabase
        .from("invite_tokens")
        .update({ invitee_name: inviteeName.trim(), member_type: memberType, relation_label: relationLabel } as any)
        .eq("token", token.split("/").pop() ?? token);

      setInviteUrl(url);
      setShowInviteModal(false);

      // Abre WhatsApp direto com a mensagem personalizada
      if (currentHouse) {
        const msg = `Oi ${inviteeName.trim()}! Entre no Acabou? para acompanhar a lista de ${currentHouse.name} comigo.\n\n${url}`;
        window.open(buildWhatsAppShareUrl(msg), "_blank");
      }
    } catch {
      alert("Erro ao gerar convite.");
    } finally {
      setLoadingInvite(false);
    }
  }

  async function copyToClipboard() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareOnWhatsApp() {
    if (!currentHouse) return;
    const msg = inviteeName
      ? `Oi ${inviteeName}! Entre no Acabou? para acompanhar a lista de ${currentHouse.name} comigo.\n\n${inviteUrl}`
      : generateInviteMessage(currentHouse.name, inviteUrl);
    window.open(buildWhatsAppShareUrl(msg), "_blank");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    reset();
    router.push("/login");
    router.refresh();
  }

  return (
    <div>
      <Header title={currentHouse?.name ?? "Minha Casa"} subtitle="Configurações da casa" />

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

        {/* ── PERFIL DO DONO (somente dono vê o botão de editar foto) ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-green-100 flex items-center justify-center">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Foto de perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-green-700">
                    {(profileName || "?")[0].toUpperCase()}
                  </span>
                )}
              </div>

              {/* Botão câmera — qualquer usuário pode alterar sua foto */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center justify-center shadow-md transition-colors disabled:opacity-60"
                title="Alterar foto"
              >
                {uploadingAvatar
                  ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Camera size={13} />
                }
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            {/* Nome e papel */}
            <div className="flex-1 min-w-0">
              {editingProfileName ? (
                <div className="flex items-center gap-2">
                  <input
                    ref={profileNameInputRef}
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveProfileName();
                      if (e.key === "Escape") setEditingProfileName(false);
                    }}
                    maxLength={60}
                    placeholder="Seu nome"
                    className="flex-1 text-base font-semibold text-gray-900 border-b-2 border-green-400 bg-transparent outline-none pb-0.5"
                  />
                  <button
                    onClick={handleSaveProfileName}
                    disabled={savingProfileName || !profileName.trim()}
                    className="text-green-600 hover:text-green-700 disabled:opacity-50 shrink-0 p-1"
                  >
                    {savingProfileName
                      ? <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                      : <Check size={16} strokeWidth={2.5} />
                    }
                  </button>
                  <button
                    onClick={() => setEditingProfileName(false)}
                    className="text-gray-400 hover:text-gray-600 shrink-0 p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 truncate">{profileName || "Sem nome"}</p>
                  <button
                    onClick={() => setEditingProfileName(true)}
                    className="text-gray-400 hover:text-green-600 transition-colors shrink-0"
                    title="Editar nome"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-1 mt-0.5">
                {isOwner ? <Crown size={13} className="text-amber-500" /> : <User size={13} className="text-gray-400" />}
                <span className="text-xs text-gray-500">{isOwner ? "Dono da conta" : "Membro"}</span>
              </div>
              {!profileName && (
                <p className="text-xs text-amber-500 mt-1">Toque no lápis para adicionar seu nome</p>
              )}
            </div>
          </div>
        </div>

        {/* ── NOME E TIPO DA CASA ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl shrink-0">{propertyType.icon}</span>
            <div className="flex-1 min-w-0">
              {/* Nome da casa — editável pelo dono */}
              {isOwner && editingHouseName ? (
                <div className="flex items-center gap-2">
                  <input
                    ref={houseNameInputRef}
                    value={houseName}
                    onChange={(e) => setHouseName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveHouseName();
                      if (e.key === "Escape") { setEditingHouseName(false); setHouseName(currentHouse?.name ?? ""); }
                    }}
                    maxLength={60}
                    className="flex-1 text-base font-semibold text-gray-900 border-b-2 border-green-400 bg-transparent outline-none pb-0.5"
                  />
                  <button
                    onClick={handleSaveHouseName}
                    disabled={savingHouseName || !houseName.trim()}
                    className="text-green-600 hover:text-green-700 disabled:opacity-50 shrink-0 p-1"
                  >
                    {savingHouseName
                      ? <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                      : <Check size={16} strokeWidth={2.5} />
                    }
                  </button>
                  <button
                    onClick={() => { setEditingHouseName(false); setHouseName(currentHouse?.name ?? ""); }}
                    className="text-gray-400 hover:text-gray-600 shrink-0 p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 truncate">{currentHouse?.name}</p>
                  {isOwner && (
                    <button
                      onClick={() => setEditingHouseName(true)}
                      className="text-gray-400 hover:text-green-600 transition-colors shrink-0"
                      title="Editar nome"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                </div>
              )}
              <p className="text-sm text-gray-500 mt-0.5">{propertyType.label} · {propertyType.hint}</p>
            </div>
          </div>
        </div>

        {/* ── MEMBROS ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-gray-500" />
              <h2 className="font-semibold text-gray-900">Membros ({activeMembers.length})</h2>
            </div>
          </div>

          {loadingMembers ? (
            <div className="px-5 py-6 flex justify-center">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-green-600 rounded-full animate-spin" />
            </div>
          ) : activeMembers.length === 0 ? (
            <div className="px-5 py-6 text-center">
              <p className="text-sm text-gray-400">Nenhum membro ainda. Convide alguém!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {activeMembers.map((member: any) => {
                const displayName = member.display_name || member.profile?.full_name || "Membro";
                const typeLabel = member.member_type === "funcionario" ? "🧑‍🔧 Funcionário" : "👨‍👩‍👧 Familiar";
                return (
                  <div key={member.id} className="px-5 py-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-semibold text-sm overflow-hidden shrink-0">
                          {member.user_id === currentUserId && avatarUrl
                            ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                            : member.profile?.avatar_url
                              ? <img src={member.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                              : <span>{displayName[0].toUpperCase()}</span>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {displayName}
                            {member.user_id === currentUserId && (
                              <span className="ml-1.5 text-xs text-gray-400">(você)</span>
                            )}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {roleIcons[member.role as MemberRole]}
                            <span className="text-xs text-gray-500">{roleLabels[member.role as MemberRole]}</span>
                            {member.relation_label && (
                              <span className="text-xs text-gray-400">· {member.relation_label}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Ações do dono sobre membros (não sobre si mesmo) */}
                      {isOwner && member.user_id !== currentUserId && (
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button
                            onClick={() => openMemberEditor(member)}
                            className="text-gray-300 hover:text-green-600 transition-colors p-1.5"
                            title="Editar membro"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleRemoveMember(member.id, displayName)}
                            className="text-gray-300 hover:text-red-500 transition-colors p-1.5"
                            title="Remover membro"
                          >
                            <UserMinus size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── CONVIDAR (somente dono + plano pago) ── */}
        {/* Banner de upgrade so aparece apos sincronizar com servidor (evita flash) */}
        {dataSyncComplete && isOwner && !isPaid && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-sm text-amber-800 text-center">
              Para convidar membros, faça upgrade para o{" "}
              <Link href="/planos" className="font-bold underline">Plano Família</Link>.
            </p>
          </div>
        )}
        {isOwner && isPaid ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-1">Convidar para a casa</h2>
            <p className="text-sm text-gray-500 mb-4">
              Gere um link e compartilhe com quem você quer convidar.
            </p>

            {!inviteUrl ? (
              <button
                onClick={() => { loadExistingMembersForInvite(); setShowInviteModal(true); }}
                className="w-full bg-green-600 text-white font-semibold py-3.5 rounded-xl hover:bg-green-700 transition-colors"
              >
                Gerar link de convite
              </button>
            ) : (
              <div className="space-y-3">
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600 break-all">
                  {inviteUrl}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm"
                  >
                    <Copy size={16} />
                    {copied ? "Copiado!" : "Copiar"}
                  </button>
                  <button
                    onClick={shareOnWhatsApp}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] hover:bg-[#1fba59] text-white font-medium transition-colors text-sm"
                  >
                    <WhatsAppIcon size={16} />
                    WhatsApp
                  </button>
                </div>
                <button
                  onClick={() => { setInviteUrl(""); setInviteeName(""); setRelationLabel(""); }}
                  className="w-full text-xs text-gray-400 hover:text-gray-600 py-1"
                >
                  Gerar novo convite
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 space-y-3">
            <p className="text-sm text-gray-500 text-center">
              🔒 Apenas o dono da casa pode convidar membros e acessar configurações.
            </p>
            <Link
              href="/planos"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-semibold text-sm hover:bg-amber-100 transition-colors"
            >
              ⭐ Ver planos e benefícios
            </Link>
          </div>
        )}

        {/* ── ADICIONAR NOVO LOCAL (somente dono) ── */}
        {isOwner && (
          <Link
            href="/casa/nova"
            className="flex items-center gap-3 bg-green-50 border-2 border-dashed border-green-200 rounded-2xl px-5 py-4 hover:bg-green-100 hover:border-green-300 transition-all"
          >
            <div className="w-9 h-9 bg-green-600 rounded-full flex items-center justify-center shrink-0">
              <Plus size={18} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-green-800 text-sm">Adicionar novo local</p>
              <p className="text-xs text-green-600 mt-0.5">Apê, praia, empresa, veraneio...</p>
            </div>
            <ChevronRight size={16} className="text-green-500 ml-auto shrink-0" />
          </Link>
        )}

        {/* ── EXCLUIR LOCAL (somente dono, e se tem mais de 1 casa) ── */}
        {isOwner && allHouses.length > 1 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            {!confirmDeleteHouse ? (
              <button
                onClick={() => setConfirmDeleteHouse(true)}
                className="w-full flex items-center justify-center gap-2 text-red-400 hover:text-red-600 text-sm font-medium transition-colors"
              >
                <Trash2 size={16} />
                Excluir este local
              </button>
            ) : (
              <div>
                <p className="text-sm text-red-600 font-medium text-center mb-3">
                  Excluir <strong>{currentHouse?.name}</strong> e todos os seus itens?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteHouse}
                    disabled={deletingHouse}
                    className="flex-1 bg-red-500 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-red-600 disabled:opacity-50"
                  >
                    {deletingHouse ? "Excluindo..." : "Sim, excluir"}
                  </button>
                  <button
                    onClick={() => setConfirmDeleteHouse(false)}
                    className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MENU (somente dono) ── */}
        {isOwner && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <Link href="/planos" className="flex items-center justify-between px-5 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                  <span className="text-sm">⭐</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Plano atual</p>
                  <p className="text-xs text-gray-500 capitalize">{currentHouse?.plan === "free" ? "Grátis" : "Família"}</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </Link>
            <Link href="/feedback" className="flex items-center justify-between px-5 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <MessageSquareHeart size={16} className="text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Enviar feedback</p>
                  <p className="text-xs text-gray-500">Sugestões, dúvidas ou problemas</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </Link>
            <ThemeToggle className="border-b border-gray-50" />
            <Link href="/configuracoes" className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <Settings size={16} className="text-gray-600" />
                </div>
                <p className="font-medium text-gray-900 text-sm">Configurações</p>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </Link>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-red-100 text-red-500 hover:bg-red-50 transition-colors font-medium"
        >
          <LogOut size={18} />
          Sair da conta
        </button>
        <div className="h-4" />
      </div>

      {/* ── MODAL DE CONVITE ── */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center px-4 py-6">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[85vh]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 text-lg">Convidar pessoa</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>

            {/* Membros já cadastrados em outros locais */}
            {existingMembers.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Adicionar membro existente</p>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-2">
                  {existingMembers.map((m: any) => (
                    <div key={m.user_id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-semibold overflow-hidden shrink-0">
                          {m.profile?.avatar_url
                            ? <img src={m.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                            : <span>{(m.profile?.full_name ?? m.display_name ?? "?")[0].toUpperCase()}</span>
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{m.display_name || m.profile?.full_name || "Membro"}</p>
                          <p className="text-xs text-gray-500 truncate">{m.relation_label || (m.member_type === "funcionario" ? "Funcionário" : "Familiar")}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddExistingMember(m.user_id, m)}
                        className="shrink-0 bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Adicionar
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 font-medium">ou convide alguém novo</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 mb-5">
              <button
                onClick={() => { setMemberType("familiar"); setRelationLabel(""); }}
                className={cn(
                  "p-3 rounded-2xl border-2 font-semibold text-sm transition-all",
                  memberType === "familiar" ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-500"
                )}
              >
                👨‍👩‍👧 Familiar
              </button>
              <button
                onClick={() => { setMemberType("funcionario"); setRelationLabel(""); }}
                className={cn(
                  "p-3 rounded-2xl border-2 font-semibold text-sm transition-all",
                  memberType === "funcionario" ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-500"
                )}
              >
                🧑‍🔧 Funcionário
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome da pessoa *</label>
              <input
                type="text"
                value={inviteeName}
                onChange={(e) => setInviteeName(e.target.value)}
                placeholder="Ex: Maria Silva"
                maxLength={80}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-green-400 text-gray-900 text-sm"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {memberType === "familiar" ? "Grau de parentesco *" : "Cargo / Função *"}
              </label>
              {memberType === "familiar" ? (
                <select
                  value={relationLabel}
                  onChange={(e) => setRelationLabel(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-green-400 text-gray-900 text-sm"
                >
                  <option value="">Selecione...</option>
                  {RELATIONS_FAMILIAR.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              ) : (
                <input
                  type="text"
                  value={relationLabel}
                  onChange={(e) => setRelationLabel(e.target.value)}
                  placeholder="Ex: Diarista, Caseiro, Babá..."
                  maxLength={80}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-green-400 text-gray-900 text-sm"
                />
              )}
            </div>

            <button
              onClick={handleGenerateInvite}
              disabled={loadingInvite}
              className="w-full bg-green-600 text-white font-bold py-4 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loadingInvite ? <><LoadingSpinner size="sm" /> Gerando...</> : "Gerar convite e compartilhar"}
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL DE EDIÇÃO DE MEMBRO ── */}
      {editingMember && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center px-4 py-6">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[85vh]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 text-lg">Editar membro</h3>
              <button onClick={() => setEditingMember(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>

            {/* Avatar do membro */}
            <div className="flex items-center gap-3 mb-5 bg-gray-50 rounded-xl p-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-semibold overflow-hidden shrink-0">
                {editingMember.profile?.avatar_url
                  ? <img src={editingMember.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <span className="text-lg">{(editingMember.profile?.full_name ?? "?")[0].toUpperCase()}</span>
                }
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{editingMember.profile?.full_name ?? "Membro"}</p>
                <p className="text-xs text-gray-500 truncate">{editingMember.profile?.email ?? ""}</p>
              </div>
            </div>

            {/* Nome de exibição */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome de exibição</label>
              <input
                type="text"
                value={editMemberName}
                onChange={(e) => setEditMemberName(e.target.value)}
                placeholder="Ex: Maria"
                maxLength={80}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-green-400 text-gray-900 text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">Deixe vazio para usar o nome original do cadastro</p>
            </div>

            {/* Tipo: Familiar ou Funcionário */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setEditMemberType("familiar"); setEditMemberRelation(""); }}
                  className={cn(
                    "p-3 rounded-2xl border-2 font-semibold text-sm transition-all",
                    editMemberType === "familiar" ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-500"
                  )}
                >
                  👨‍👩‍👧 Familiar
                </button>
                <button
                  onClick={() => { setEditMemberType("funcionario"); setEditMemberRelation(""); }}
                  className={cn(
                    "p-3 rounded-2xl border-2 font-semibold text-sm transition-all",
                    editMemberType === "funcionario" ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-500"
                  )}
                >
                  🧑‍🔧 Funcionário
                </button>
              </div>
            </div>

            {/* Parentesco ou Cargo */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {editMemberType === "familiar" ? "Grau de parentesco" : "Cargo / Função"}
              </label>
              {editMemberType === "familiar" ? (
                <select
                  value={editMemberRelation}
                  onChange={(e) => setEditMemberRelation(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-green-400 text-gray-900 text-sm"
                >
                  <option value="">Selecione...</option>
                  {RELATIONS_FAMILIAR.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              ) : (
                <input
                  type="text"
                  value={editMemberRelation}
                  onChange={(e) => setEditMemberRelation(e.target.value)}
                  placeholder="Ex: Diarista, Caseiro, Babá..."
                  maxLength={80}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-green-400 text-gray-900 text-sm"
                />
              )}
            </div>

            {/* Botões de ação */}
            <div className="space-y-2">
              <button
                onClick={handleSaveMember}
                disabled={savingMember}
                className="w-full bg-green-600 text-white font-bold py-3.5 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {savingMember ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Salvando...</> : "Salvar alterações"}
              </button>
              <button
                onClick={() => {
                  handleRemoveMember(editingMember.id, editMemberName || editingMember.profile?.full_name || "este membro");
                  setEditingMember(null);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors font-medium text-sm"
              >
                <UserMinus size={16} />
                Remover deste local
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
