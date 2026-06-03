import Link from "next/link";
import { PublicBottomNav } from "@/components/layout/PublicBottomNav";

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-green-600 text-white px-6 py-5">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="text-green-200 text-sm hover:text-white mb-2 block">← Voltar</Link>
          <h1 className="text-2xl font-bold">Política de Privacidade</h1>
          <p className="text-green-100 text-sm mt-1">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 prose prose-gray">
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. Quem somos</h2>
          <p className="text-gray-600">
            O <strong>Acabou?</strong> é um aplicativo SaaS brasileiro de lista de compras familiar.
            Levamos sua privacidade a sério e coletamos apenas os dados necessários para o funcionamento do serviço.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">2. Dados que coletamos</h2>
          <ul className="text-gray-600 space-y-2 list-disc pl-5">
            <li><strong>Dados de cadastro:</strong> nome, e-mail, senha (criptografada) e WhatsApp (opcional).</li>
            <li><strong>Dados da casa:</strong> nome da casa, itens da despensa e lista de compras.</li>
            <li><strong>Dados de uso:</strong> histórico de ações (o que foi marcado como acabou, comprado etc.) para melhorar a experiência.</li>
            <li><strong>Cidade e estado</strong> (opcionais), apenas para personalização futura.</li>
          </ul>
          <p className="text-gray-600 mt-3">
            <strong>Não coletamos CPF, dados bancários ou qualquer dado sensível.</strong>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">3. Como usamos seus dados</h2>
          <ul className="text-gray-600 space-y-2 list-disc pl-5">
            <li>Para fornecer o serviço do Acabou? (lista, despensa, membros, planos).</li>
            <li>Para enviar comunicações relacionadas ao serviço (ex: confirmação de e-mail).</li>
            <li>Para análise agregada e anônima de uso (ex: categorias mais populares) visando melhorar o produto.</li>
          </ul>
          <p className="text-gray-600 mt-3">
            <strong>Não vendemos seus dados pessoais a terceiros.</strong>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">4. Compartilhamento de dados</h2>
          <p className="text-gray-600">
            Seus dados são compartilhados apenas com outros membros da sua casa (que você convidou) e com os
            provedores de serviço essenciais ao funcionamento do app:
          </p>
          <ul className="text-gray-600 space-y-1 list-disc pl-5 mt-2">
            <li><strong>Supabase</strong> — banco de dados e autenticação (hospedado na AWS).</li>
            <li><strong>Mercado Pago</strong> — processamento de pagamentos (quando aplicável).</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">5. Seus direitos (LGPD)</h2>
          <p className="text-gray-600">Conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018), você tem direito a:</p>
          <ul className="text-gray-600 space-y-1 list-disc pl-5 mt-2">
            <li>Acessar e corrigir seus dados pessoais nas Configurações do app.</li>
            <li>Excluir sua conta e todos os seus dados em Configurações → Excluir conta.</li>
            <li>Revogar consentimento a qualquer momento.</li>
            <li>Portabilidade dos seus dados mediante solicitação.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">6. Segurança</h2>
          <p className="text-gray-600">
            Usamos criptografia, Row Level Security no banco de dados e autenticação segura para proteger seus dados.
            Senhas nunca são armazenadas em texto puro.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">7. Contato</h2>
          <p className="text-gray-600">
            Dúvidas sobre privacidade? Envie um e-mail para{" "}
            <a href="mailto:contato@acabouapp.com.br" className="font-bold text-green-700 hover:underline">
              contato@acabouapp.com.br
            </a>.
          </p>
        </section>
      </main>
      <div className="pb-16" />
      <PublicBottomNav />
    </div>
  );
}
