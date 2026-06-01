"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/shared/Logo";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState("");

  // Captura token de convite se vier da URL ?convite=TOKEN
  const [conviteToken] = useState(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("convite");
  });

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("E-mail ou senha incorretos. Tente novamente.");
      setLoading(false);
      return;
    }

    // Se veio de um convite, redireciona para aceitar
    if (conviteToken) {
      router.push(`/convite/${conviteToken}`);
    } else {
      router.push("/home");
    }
    router.refresh();
  }

  async function handleGoogle() {
    setLoadingGoogle(true);
    setError("");

    // IMPORTANTE: Salva o token de convite em COOKIE + localStorage ANTES do OAuth
    // O Supabase perde query params na URL de callback
    // Cookie sobrevive aos redirects e pode ser lido no servidor
    if (conviteToken) {
      document.cookie = `acabou_pending_invite=${conviteToken}; path=/; max-age=3600; SameSite=Lax`;
      localStorage.setItem("acabou_pending_invite", conviteToken);
    }

    // Preserva token de convite na URL de callback (tentativa primária)
    const callbackUrl = conviteToken
      ? `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(`/convite/${conviteToken}`)}`
      : `${window.location.origin}/api/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
      },
    });
    if (error) {
      setError("Erro ao entrar com Google. Tente novamente.");
      setLoadingGoogle(false);
    }
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center px-4 py-8" style={{ background: "linear-gradient(135deg, #d4f5e0 0%, #a7e8c0 30%, #16a34a 70%, #15803d 100%)" }}>
      {/* Floating emojis */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {[
          { emoji: "🛒", x: "8%", y: "12%", size: "1.8rem", opacity: 0.2 },
          { emoji: "☕", x: "88%", y: "8%", size: "1.5rem", opacity: 0.15 },
          { emoji: "🍞", x: "5%", y: "75%", size: "1.4rem", opacity: 0.12 },
          { emoji: "🥛", x: "92%", y: "70%", size: "1.6rem", opacity: 0.15 },
          { emoji: "🍎", x: "15%", y: "45%", size: "1.3rem", opacity: 0.1 },
          { emoji: "🧴", x: "85%", y: "40%", size: "1.4rem", opacity: 0.12 },
        ].map((f, i) => (
          <span key={i} className="absolute animate-float" style={{ left: f.x, top: f.y, fontSize: f.size, opacity: f.opacity, animationDuration: "10s", animationDelay: `${-i * 1.8}s` }}>{f.emoji}</span>
        ))}
      </div>

      {/* Botão voltar */}
      <div className="absolute top-4 left-4">
        <Link href="/" className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium transition-colors bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
          <ArrowLeft size={14} />
          Início
        </Link>
      </div>

      {/* Card principal */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-7 relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <Logo size="lg" linked />
          <h1 className="text-xl font-black text-gray-900 mt-3">Bem-vindo de volta</h1>
          <p className="text-gray-500 text-sm mt-1">Entre na sua conta</p>
        </div>

        {/* Botão Google */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={loadingGoogle}
          className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 hover:border-gray-300 bg-white text-gray-700 font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-60 mb-5"
        >
          {/* Google icon */}
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loadingGoogle ? "Aguarde..." : "Entrar com Google"}
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-gray-400 text-xs font-medium">ou entre com e-mail</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="seu@email.com"
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-green-400 focus:bg-white transition-colors text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Sua senha"
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-green-400 focus:bg-white transition-colors text-gray-900 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white font-semibold py-4 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-60 text-base mt-2"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="mt-5 text-center">
          <p className="text-gray-500 text-sm">
            Não tem conta?{" "}
            <Link
              href={conviteToken ? `/cadastro?convite=${conviteToken}` : "/cadastro"}
              className="text-green-600 font-bold hover:underline"
            >
              Criar conta grátis
            </Link>
          </p>
        </div>
      </div>

      {/* Badges de confiança */}
      <div className="flex items-center justify-center gap-4 mt-5 text-white/70 text-xs font-medium flex-wrap">
        <span>✅ Seguro</span>
        <span>✅ Sem anúncios</span>
        <span>✅ 100% LGPD</span>
      </div>
    </div>
  );
}
