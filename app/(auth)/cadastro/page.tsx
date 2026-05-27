"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/shared/Logo";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function CadastroPage() {
  const router = useRouter();
  const supabase = createClient();

  // Captura token de convite se vier da URL ?convite=TOKEN
  const [conviteToken] = useState(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("convite");
  });

  // Se tem convite, não precisa de Step 2 (criar casa)
  const hasInvite = !!conviteToken;
  const totalSteps = hasInvite ? 1 : 2;

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState("");

  // Step 1: conta
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");

  // Step 2: casa (só para quem NÃO tem convite)
  const [houseName, setHouseName] = useState("");
  const [propertyType, setPropertyType] = useState("casa");

  const PROPERTY_TYPES = [
    { id: "casa",        label: "Casa",        icon: "🏠" },
    { id: "apartamento", label: "Apê",         icon: "🏢" },
    { id: "praia",       label: "Praia",       icon: "🏖️" },
    { id: "veraneio",    label: "Veraneio",    icon: "🌲" },
    { id: "empresa",     label: "Empresa",     icon: "💼" },
    { id: "outro",       label: "Outro",       icon: "📍" },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Step 1 → validação e avanço
    if (step === 1 && !hasInvite) {
      if (password.length < 6) {
        setError("A senha deve ter pelo menos 6 caracteres.");
        return;
      }
      setError("");
      setStep(2);
      return;
    }

    // Se tem convite → criar conta + perfil (sem casa) e ir para /convite/TOKEN
    // Se NÃO tem convite → criar conta + casa + perfil e ir para /onboarding
    setLoading(true);
    setError("");

    try {
      // Valida senha no step 1 quando tem convite
      if (hasInvite && password.length < 6) {
        setError("A senha deve ter pelo menos 6 caracteres.");
        setLoading(false);
        return;
      }

      // 1. Cria conta no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Erro ao criar conta.");

      const userId = authData.user.id;

      if (hasInvite) {
        // Usuário convidado: cria perfil + aceita convite server-side
        const res = await fetch("/api/criar-perfil", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, fullName, phone, conviteToken }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Erro ao criar perfil.");
        }
      } else {
        // Usuário normal: cria casa + perfil
        const res = await fetch("/api/criar-casa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, houseName, fullName, phone, propertyType }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Erro ao criar casa.");
        }
      }

      // Meta Pixel — rastreia conversão de cadastro
      if (typeof window !== "undefined" && typeof (window as any).fbq === "function") {
        (window as any).fbq("track", "CompleteRegistration");
      }

      // Redireciona
      if (conviteToken) {
        // Convite já foi aceito server-side → vai direto para o app
        router.push("/home");
      } else {
        router.push("/onboarding");
      }
      router.refresh();
    } catch (err: any) {
      if (err.message?.includes("already registered")) {
        setError("Este e-mail já está cadastrado. Tente fazer login.");
      } else {
        setError(err.message ?? "Erro ao criar conta. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
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

    // Preserva o token de convite na URL de callback (tentativa primária)
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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Botão voltar */}
      <div className="px-6 pt-5">
        {step === 1 ? (
          <Link href="/" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-700 text-sm transition-colors">
            <ArrowLeft size={16} />
            Voltar ao início
          </Link>
        ) : (
          <button onClick={() => setStep(1)} className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-700 text-sm transition-colors">
            <ArrowLeft size={16} />
            Voltar
          </button>
        )}
      </div>

      {/* Header — logo clicável */}
      <div className="px-6 pt-6 pb-6 flex flex-col items-center text-center">
        <Logo size="lg" linked />
        <p className="text-gray-500 text-sm mt-3">
          {hasInvite
            ? "Crie sua conta para aceitar o convite"
            : step === 1
              ? "Crie sua conta grátis"
              : "Como se chama sua casa?"}
        </p>
      </div>

      {/* Progress */}
      <div className="px-6 mb-6">
        <div className="flex gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-green-600" />
          {!hasInvite && (
            <div className={`flex-1 h-1.5 rounded-full ${step === 2 ? "bg-green-600" : "bg-gray-200"}`} />
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          {hasInvite ? "Cadastro rápido" : `Passo ${step} de ${totalSteps}`}
        </p>
      </div>

      <div className="flex-1 px-6 max-w-md mx-auto w-full">
        {/* Google — só no step 1 */}
        {step === 1 && (
          <>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loadingGoogle}
              className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 hover:border-gray-300 bg-white text-gray-700 font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-60 mb-5"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loadingGoogle ? "Aguarde..." : "Continuar com Google"}
            </button>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-gray-400 text-xs font-medium">ou cadastre com e-mail</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Seu nome *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoFocus
                  placeholder="Como você se chama?"
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-green-400 focus:bg-white transition-colors text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha *</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="Mínimo 6 caracteres"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="(11) 99999-9999"
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-green-400 focus:bg-white transition-colors text-gray-900"
                />
              </div>

              {hasInvite && (
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-sm text-green-800">
                    🎉 Você foi convidado! Após criar sua conta, você será direcionado para aceitar o convite.
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Tipo de imóvel */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Que tipo de lugar é esse? *</label>
                <div className="grid grid-cols-3 gap-2">
                  {PROPERTY_TYPES.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPropertyType(p.id)}
                      className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-xs font-semibold transition-all ${
                        propertyType === p.id
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-200 text-gray-500 hover:border-green-300"
                      }`}
                    >
                      <span className="text-xl">{p.icon}</span>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nome do lugar *
                </label>
                <input
                  type="text"
                  value={houseName}
                  onChange={(e) => setHouseName(e.target.value)}
                  required
                  autoFocus
                  placeholder="Ex: Casa da Ana, Família Silva, Rancho..."
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-green-400 focus:bg-white transition-colors text-gray-900"
                />
              </div>

              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-sm text-green-800">
                  💡 Você pode convidar sua família depois. Agora, vamos configurar sua despensa com os itens que você costuma ter em casa.
                </p>
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (step === 1
              ? !fullName || !email || !password || !phone
              : !houseName)}
            className="w-full bg-green-600 text-white font-semibold py-4 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-60 text-base mt-2"
          >
            {loading
              ? (hasInvite ? "Criando conta..." : "Criando conta...")
              : step === 1
                ? (hasInvite ? "Criar conta e aceitar convite" : "Continuar")
                : "Criar minha casa"}
          </button>
        </form>

        {step === 1 && (
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Já tem conta?{" "}
              <Link
                href={conviteToken ? `/login?convite=${conviteToken}` : "/login"}
                className="text-green-600 font-semibold hover:underline"
              >
                Entrar
              </Link>
            </p>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-8 pb-6">
          Ao criar sua conta você concorda com nossos{" "}
          <Link href="/termos" className="underline">Termos de Uso</Link> e{" "}
          <Link href="/privacidade" className="underline">Política de Privacidade</Link>.
        </p>
      </div>
    </div>
  );
}
