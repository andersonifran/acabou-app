# Acabou? 🛒

**Sua casa sempre sabe o que precisa comprar.**

Marque o que acabou em segundos, compartilhe com sua família e vá ao mercado com a lista certa.

---

## Stack

- **Framework:** Next.js 16 (App Router)
- **Linguagem:** TypeScript
- **Estilo:** Tailwind CSS v4
- **Backend/DB:** Supabase (PostgreSQL + Auth + RLS)
- **Estado:** Zustand
- **Pagamentos:** Mercado Pago (estrutura preparada)

---

## Pré-requisitos

- Node.js 20+
- Conta no [Supabase](https://supabase.com) (gratuita)

---

## Setup Local

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Edite `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
ADMIN_EMAILS=seuemail@exemplo.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Configurar o Supabase

No SQL Editor do Supabase, execute em ordem:
1. `supabase/schema.sql` — cria tabelas, RLS e triggers
2. `supabase/seed.sql` — insere categorias padrão

Ative **Email Auth** em: Authentication → Providers → Email

### 4. Rodar

```bash
npm run dev
```

Acesse: http://localhost:3000

---

## Estrutura

```
app/
├── page.tsx              # Landing page
├── (auth)/               # Login e Cadastro
├── (app)/                # App principal (protegido)
│   ├── home/
│   ├── despensa/
│   ├── lista/
│   ├── casa/
│   ├── planos/
│   └── configuracoes/
├── (admin)/painel/       # Painel admin
├── onboarding/
├── convite/[token]/
├── privacidade/
└── termos/
```

---

## Deploy (Vercel)

```bash
vercel
```

Configure as mesmas variáveis de ambiente na dashboard da Vercel. Troque `NEXT_PUBLIC_APP_URL` pelo domínio real.

---

## Ativar Pagamentos (Mercado Pago)

1. Obtenha as credenciais em mercadopago.com.br/developers
2. Configure `MERCADOPAGO_ACCESS_TOKEN` no `.env.local`
3. Instale: `npm install mercadopago`
4. Descomente o código em `lib/mercadopago.ts`
5. Implemente `app/api/pagamento/route.ts`

---

## Getting Started (original Next.js docs)

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
