"use client";

import { useState, useRef } from "react";
import { Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface ProfileAvatarProps {
  avatarUrl: string | null;
  fullName: string;
  size?: "sm" | "md" | "lg";
  editable?: boolean;
  onAvatarChange?: (newUrl: string) => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

const sizeClasses = {
  sm: "w-12 h-12 text-sm",
  md: "w-20 h-20 text-xl",
  lg: "w-28 h-28 text-3xl",
};

const cameraSizeClasses = {
  sm: "w-6 h-6 -bottom-0.5 -right-0.5",
  md: "w-8 h-8 -bottom-0.5 -right-0.5",
  lg: "w-9 h-9 bottom-0 right-0",
};

export function ProfileAvatar({
  avatarUrl,
  fullName,
  size = "lg",
  editable = false,
  onAvatarChange,
}: ProfileAvatarProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const displayUrl = previewUrl || avatarUrl;
  const initials = getInitials(fullName || "?");

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho (2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 2MB.");
      return;
    }

    // Validar tipo
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      alert("Formato não suportado. Use JPG, PNG, WebP ou GIF.");
      return;
    }

    // Preview imediato
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      // Pegar userId
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      // Mesmo padrão da página /casa: arquivo na raiz do bucket com nome = userId
      const filePath = `${user.id}.${fileExt}`;

      // Upload para Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true, // Sobrescreve se já existir
        });

      if (uploadError) throw uploadError;

      // Gerar URL pública
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Adicionar timestamp para cache busting
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Atualizar profile no banco (salva URL sem timestamp para consistência)
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: urlData.publicUrl, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setPreviewUrl(null);
      onAvatarChange?.(publicUrl);
    } catch (err: any) {
      console.error("Erro ao fazer upload:", err);
      setPreviewUrl(null);
      alert("Erro ao enviar foto. Tente novamente.");
    } finally {
      setUploading(false);
      // Limpa input para permitir reenvio do mesmo arquivo
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="relative inline-block">
      {/* Avatar */}
      <div
        className={cn(
          "rounded-full overflow-hidden bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center font-bold text-white shadow-lg ring-4 ring-white",
          sizeClasses[size],
          uploading && "opacity-70"
        )}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt={fullName}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}

        {/* Overlay de loading */}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Botão de câmera */}
      {editable && (
        <>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "absolute bg-green-600 text-white rounded-full flex items-center justify-center shadow-md border-2 border-white hover:bg-green-700 transition-colors disabled:opacity-50",
              cameraSizeClasses[size]
            )}
          >
            <Camera size={size === "sm" ? 12 : size === "md" ? 16 : 18} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            className="hidden"
          />
        </>
      )}
    </div>
  );
}
