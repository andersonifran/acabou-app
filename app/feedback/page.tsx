"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/shared/Logo";
import { PublicBottomNav } from "@/components/layout/PublicBottomNav";
import { Send, MessageSquareHeart, ChevronLeft, Loader2 } from "lucide-react";

export default function FeedbackPage() {
  const router = useRouter();
  const supabase = createClient();
  const [feedback, setFeedback] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!feedback.trim() || feedback.trim().length < 3) return;
    setSending(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Chama API que salva no banco + envia e-mail para suporteacabou@gmail.com
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: feedback.trim(),
          userName: user?.user_metadata?.full_name ?? null,
          userEmail: user?.email ?? null,
        }),
      });

      if (!res.ok) throw new Error("Erro ao enviar");

      setSent(true);
      setFeedback("");
    } catch {
      // Fallback: abre cliente de e-mail
      const subject = encodeURIComponent("Feedback - Acabou?");
      const body = encodeURIComponent(feedback.trim());
      window.open(`mailto:suporteacabou@gmail.com?subject=${subject}&body=${body}`);
      setSent(true);
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <div className="w-24 h-24 rounded-3xl bg-green-50 flex items-center justify-center border-2 border-green-100 mb-6">
          <span className="text-5xl">💚</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Recebemos!</h2>
        <p className="text-gray-500 mb-8 max-w-xs leading-relaxed">
          Obrigado por dedicar um tempinho pra gente. Lemos cada mensagem pessoalmente — você está ajudando a deixar o{" "}
          <span className="font-semibold text-gray-700">Acabou?</span> ainda melhor para toda família brasileira.
        </p>
        <button
          onClick={() => router.back()}
          className="bg-green-600 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-green-700 transition-colors"
        >
          Voltar ao app
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600"
        >
          <ChevronLeft size={22} />
        </button>
        <Logo size="sm" />
        <span className="font-semibold text-gray-700 text-sm">Feedback</span>
      </div>

      <div className="flex-1 px-6 py-8 max-w-md mx-auto w-full">
        {/* Ícone + título */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-green-50 flex items-center justify-center border-2 border-green-100 mb-4">
            <MessageSquareHeart className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Sua opinião importa!</h2>
          <p className="text-gray-500 text-sm mt-2">
            Sugestões, elogios ou problemas — conta tudo. Lemos cada mensagem pessoalmente.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              O que você gostaria de nos dizer?
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Ex: Adorei o app! Seria ótimo ter a opção de..."
              rows={6}
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-green-400 focus:bg-white transition-colors text-gray-900 resize-none text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">{feedback.length} caracteres</p>
          </div>

          <button
            type="submit"
            disabled={sending || feedback.trim().length < 3}
            className="w-full bg-green-600 text-white font-semibold py-4 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-60 text-base flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send size={18} />
                Enviar sugestão
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Todas as sugestões são lidas pela nossa equipe e ajudam a decidir o que construir a seguir.
        </p>
      </div>

      {/* Rodapé do app (só aparece com sessão válida) — sente que continua no Acabou */}
      <div className="pb-16" />
      <PublicBottomNav />
    </div>
  );
}
