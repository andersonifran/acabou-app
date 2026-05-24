"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/shared/Logo";
import { Eye, EyeOff } from "lucide-react";

export default function CadastroPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<1 | 2>(1);
  // Captura token de convite se vier da URL ?convite=TOKEN
  const [conviteToken] = useState(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("convite");
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: conta
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");

  // Step 2: casa
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

    if (step === 1) {
      if (password.length < 6) {
        setError("A senha deve ter pelo menos 6 caracteres.");
        return;
      }
      setError("");
      setStep(2);
      return;
    }

    // Step 2: cria conta + casa
    setLoading(true);
    setError("");

    try {
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

      // 2. Cria a casa e o perfil via API (usa service role para bypassar RLS)
      const res = await fetch("/api/criar-casa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, houseName, fullName, phone, propertyType }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erro ao criar casa.");
      }

      // Se veio de um convite, redireciona de volta para aceitar
      if (conviteToken) {
        router.push(`/convite/${conviteToken}`);
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

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="px-6 pt-10 pb-6 flex flex-col items-center text-center">
        <Logo size="lg" />
        <p className="text-gray-500 text-sm mt-3">
          {step === 1 ? "Crie sua conta grátis" : "Como se chama sua casa?"}
        </p>
      </div>

      {/* Progress */}
      <div className="px-6 mb-6">
        <div className="flex gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-green-600" />
          <div className={`flex-1 h-1.5 rounded-full ${step === 2 ? "bg-green-600" : "bg-gray-200"}`} />
        </div>
        <p className="text-xs text-gray-400 mt-1.5">Passo {step} de 2</p>
      </div>

      <div className="flex-1 px-6 max-w-md mx-auto w-full">
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  WhatsApp{" "}
                  <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-green-400 focus:bg-white transition-colors text-gray-900"
                />
              </div>
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
            disabled={loading || (step === 1 ? !fullName || !email || !password : !houseName)}
            className="w-full bg-green-600 text-white font-semibold py-4 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-60 text-base mt-2"
          >
            {loading ? "Criando conta..." : step === 1 ? "Continuar" : "Criar minha casa"}
          </button>
        </form>

        {step === 1 && (
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Já tem conta?{" "}
              <Link href="/login" className="text-green-600 font-semibold hover:underline">
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
