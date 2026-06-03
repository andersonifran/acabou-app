import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LogoIcon } from "@/components/shared/Logo";

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-green-600 text-white px-6 py-5">
        <div className="max-w-3xl mx-auto">
          {/* Topo: pill "Início" (igual cadastro/login) + logo clicável */}
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="inline-flex items-center gap-1.5 text-green-700 text-sm font-semibold bg-white shadow-md hover:shadow-lg px-4 py-2 rounded-full transition-all">
              <ArrowLeft size={14} /> Início
            </Link>
            <Link href="/" className="flex items-center gap-2" aria-label="Acabou? — voltar ao início">
              <span className="bg-white rounded-xl p-1 inline-flex shadow-sm"><LogoIcon size={26} /></span>
              <span className="text-lg font-black text-white">Acabou?</span>
            </Link>
          </div>
          <h1 className="text-2xl font-bold">Termos de Uso</h1>
          <p className="text-green-100 text-sm mt-1">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 prose prose-gray">
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. Aceitação dos Termos</h2>
          <p className="text-gray-600">
            Ao criar uma conta no <strong>Acabou?</strong>, você concorda com estes Termos de Uso.
            Se não concordar, não utilize o serviço.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">2. Descrição do Serviço</h2>
          <p className="text-gray-600">
            O Acabou? é um app de lista de compras familiar que permite gerenciar itens da despensa,
            compartilhar listas com membros da casa e organizar compras. O serviço está disponível
            em plano grátis e planos pagos.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">3. Planos e Pagamentos</h2>
          <ul className="text-gray-600 space-y-2 list-disc pl-5">
            <li><strong>Plano Grátis:</strong> Disponível sem prazo, com limitações de uso.</li>
            <li><strong>Plano Família Mensal (a partir de R$ 8,90/mês):</strong> Renovado automaticamente todo mês. O valor pode variar conforme promoções vigentes.</li>
            <li><strong>Plano Família Anual (a partir de R$ 59,90/ano):</strong> Renovado automaticamente todo ano. O valor pode variar conforme promoções vigentes.</li>
            <li>Cancelamentos podem ser feitos a qualquer momento, sem multa.</li>
            <li>Reembolsos serão avaliados caso a caso.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">4. Uso Adequado</h2>
          <p className="text-gray-600">Você concorda em:</p>
          <ul className="text-gray-600 space-y-1 list-disc pl-5 mt-2">
            <li>Usar o serviço apenas para fins pessoais e domésticos.</li>
            <li>Não tentar burlar os limites dos planos.</li>
            <li>Não usar o serviço para atividades ilegais.</li>
            <li>Manter suas credenciais de acesso em segurança.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">5. Disponibilidade do Serviço</h2>
          <p className="text-gray-600">
            Buscamos manter o serviço disponível 24h/dia, mas não garantimos disponibilidade ininterrupta.
            Podemos realizar manutenções e atualizações sem aviso prévio.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">6. Limitação de Responsabilidade</h2>
          <p className="text-gray-600">
            O Acabou? não se responsabiliza por perdas de dados decorrentes de falhas técnicas imprevisíveis.
            Recomendamos não usar o app como único registro de informações críticas.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">7. Encerramento de Conta</h2>
          <p className="text-gray-600">
            Você pode excluir sua conta a qualquer momento em Configurações → Excluir conta.
            Nos reservamos o direito de suspender contas que violem estes Termos.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">8. Alterações nos Termos</h2>
          <p className="text-gray-600">
            Podemos atualizar estes Termos. Notificaremos sobre mudanças significativas por e-mail ou pelo app.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">9. Lei Aplicável</h2>
          <p className="text-gray-600">
            Estes Termos são regidos pelas leis brasileiras. Foro da comarca do estado de São Paulo.
          </p>
        </section>
      </main>
    </div>
  );
}
