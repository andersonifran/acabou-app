import { createBrowserClient } from "@supabase/ssr";

// Cria o cliente do navegador. Função separada só para INFERIR o tipo exato
// (createBrowserClient(url, key)) e preservar a tipagem das queries.
function makeBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Cliente único (singleton) para todo o app no navegador.
// IMPORTANTE: criar vários clientes faz cada um gerenciar a sessão por conta
// própria → renovações de token concorrentes → refresh token (uso único) falha
// → usuário deslogado sem querer. Uma instância só evita essa corrida.
let browserClient: ReturnType<typeof makeBrowserClient> | undefined;

export function createClient() {
  return (browserClient ??= makeBrowserClient());
}
