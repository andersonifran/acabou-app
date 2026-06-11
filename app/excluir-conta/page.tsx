import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Trash2, Mail } from "lucide-react";
import { LogoIcon } from "@/components/shared/Logo";

export const metadata: Metadata = {
  title: "Excluir conta e dados — Acabou?",
  description:
    "Como solicitar a exclusão da sua conta e de todos os seus dados no aplicativo Acabou?.",
  alternates: { canonical: "/excluir-conta" },
  robots: { index: true, follow: true },
};

// Página PÚBLICA (sem login) — é a URL de exclusão de conta/dados exigida pela
// Google Play (formulário "Segurança dos dados"). O revisor do Google e qualquer
// usuário precisam conseguir abrir e entender o processo SEM estar logado.
export default function ExcluirContaPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-green-600 text-white px-6 py-5">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-green-700 text-sm font-semibold bg-white shadow-md hover:shadow-lg px-4 py-2 rounded-full transition-all"
            >
              <ArrowLeft size={14} /> Início
            </Link>
            <Link href="/" className="flex items-center gap-2" aria-label="Acabou? — voltar ao início">
              <span className="bg-white rounded-xl p-1 inline-flex shadow-sm">
                <LogoIcon size={26} />
              </span>
              <span className="text-lg font-black text-white">Acabou?</span>
            </Link>
          </div>
          <h1 className="text-2xl font-bold">Excluir sua conta e seus dados</h1>
          <p className="text-green-100 text-sm mt-1">
            Aplicativo <strong>Acabou?</strong> — você pode apagar tudo a qualquer momento.
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 prose prose-gray">
        <section className="mb-8">
          <p className="text-gray-600">
            No <strong>Acabou?</strong> você tem total controle sobre seus dados. A exclusão é
            <strong> imediata e permanente</strong> — não guardamos cópias depois que você confirma.
          </p>
        </section>

        {/* Caminho 1 — dentro do app (self-service) */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Trash2 size={20} className="text-green-600" />
            <h2 className="text-xl font-bold text-gray-900 m-0">
              Opção 1 — Direto no aplicativo (recomendado)
            </h2>
          </div>
          <ol className="text-gray-600 space-y-2 list-decimal pl-5">
            <li>Abra o app <strong>Acabou?</strong> e faça login.</li>
            <li>
              Toque em <strong>Configurações</strong> (ícone de engrenagem no menu inferior).
            </li>
            <li>
              Role até o final e toque em <strong>“Excluir minha conta”</strong>.
            </li>
            <li>Confirme. Pronto — sua conta e seus dados são apagados na hora.</li>
          </ol>
        </section>

        {/* Caminho 2 — por e-mail (sem acesso ao app) */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Mail size={20} className="text-green-600" />
            <h2 className="text-xl font-bold text-gray-900 m-0">
              Opção 2 — Por e-mail (caso não consiga acessar o app)
            </h2>
          </div>
          <p className="text-gray-600">
            Envie um e-mail para{" "}
            <a
              href="mailto:contato@acabouapp.com.br?subject=Excluir%20minha%20conta%20-%20Acabou"
              className="text-green-700 font-semibold underline"
            >
              contato@acabouapp.com.br
            </a>{" "}
            com o assunto <strong>“Excluir minha conta”</strong>, usando o mesmo e-mail cadastrado no
            app. Nós confirmamos sua identidade e apagamos sua conta em até <strong>7 dias</strong>.
          </p>
        </section>

        {/* O que é apagado */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">O que é apagado</h2>
          <p className="text-gray-600 mb-2">
            Ao excluir a conta, removemos <strong>permanentemente</strong>:
          </p>
          <ul className="text-gray-600 space-y-2 list-disc pl-5">
            <li>Seu perfil (nome, e-mail, telefone e foto).</li>
            <li>As casas das quais você é dono, com toda a despensa, lista de compras e histórico.</li>
            <li>Seus convites, notificações e inscrições de notificação push.</li>
            <li>Os registros de assinatura associados às suas casas.</li>
            <li>Sua conta de acesso (login).</li>
          </ul>
          <p className="text-gray-600 mt-3">
            Se você é apenas <strong>membro convidado</strong> de uma casa, a exclusão remove você
            dessa casa e apaga o seu perfil — os dados da casa do dono permanecem com ele.
          </p>
        </section>

        {/* Retenção / exceções */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Retenção</h2>
          <p className="text-gray-600">
            Não retemos seus dados após a exclusão. Registros estritamente necessários por obrigação
            legal ou fiscal (por exemplo, comprovantes de pagamento já emitidos) podem ser mantidos
            pelo prazo exigido por lei, de forma isolada, e nunca são usados para outra finalidade.
          </p>
        </section>

        <section className="mb-4">
          <p className="text-gray-500 text-sm">
            Dúvidas sobre privacidade? Veja nossa{" "}
            <Link href="/privacidade" className="text-green-700 underline font-medium">
              Política de Privacidade
            </Link>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
