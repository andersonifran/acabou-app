# 📋 Acabou? — Próximos passos e pendências

> Documento vivo. Atualizado em **05/06/2026**. Use como checklist pra não esquecer nada.

---

## ✅ Já concluído (resumo)
- 🛡️ Bug crítico de notificação push (re-sync na abertura + blindagem no Service Worker)
- 🔔 Notificação "alguém marcou um item" → **server-side** (Database Webhook do Supabase) — testado
- 🛒 Lembrete diário **no horário escolhido** (Vercel Pro, cron a cada 15 min)
- 👀 Nudge diário estilo Duolingo (12 frases rotativas, 1x/dia, sem incomodar) — SQL `last_active_at` rodado
- 🔄 Lembrete de item recorrente (bug de ciclo corrigido)
- 💰 Vercel Pro + Spend Management (alerta de gasto, app nunca pausa)
- 🇧🇷 Servidor em São Paulo (gru1), junto do Supabase
- 📊 Web Analytics (Vercel)
- 🐞 Sentry (monitor de erros) + **source maps** (rastro 100% legível) — testado
- 🎨 Landing + app no capricho premium (contraste, sombras, brilho pulsante no Anual, ícones, letreiro com fade)
- 📲 Play Billing — **peça 1 (cliente)** pronta
- 📵 **Barra de URL no TWA RESOLVIDA (05/06/2026)** — eram 2 bugs: (a) `assetlinks.json` com fingerprint velho → trocado pelas chaves SHA-256 reais do Play Console (assinatura Google `41:B8:7E:0B…` + upload `27:D0:A6:D4…`); (b) middleware redirecionava `/.well-known/` pro `/login` → liberado no matcher. Validado pela API oficial do Google (Digital Asset Links). Some no celular ao reinstalar.
- 🌐 **Tela de opt-in em inglês ESCLARECIDA (05/06/2026)** — não era bug nosso: idioma padrão do app **é** pt-BR (confirmado no Play Console). A página de convite é do Google e segue o idioma do **navegador** de quem abre. Solução: usar sempre o link com `?hl=pt-BR` e abrir no celular Android.

---

## ⏳ Rodando sozinho (SEM ação necessária)
- 📈 Monitor de subscriptions push — roda dia **07/06 às 10h** (mostra o número subindo)
- 🔁 Notificações se auto-consertando conforme os usuários abrem o app

---

## 🔴 CRÍTICO — fazer EM PARALELO (relógio correndo, não depende do Play Billing)
1. **Teste fechado (12 testadores / 14 dias)** — exigência do Google pra publicar em produção:
   - [ ] Confirmar que o teste foi **aprovado** no Play Console
   - [ ] Pegar o **link de opt-in** e mandar pros testadores (família + usuários reais)
   - [ ] Garantir **12+ testadores ativos por 14 dias seguidos** (é o item mais DEMORADO — quanto antes começar, melhor)
2. ~~**Verificação do banco** — confirmar o depósito de centavos~~ ✅ **FEITO (05/06/2026)** — depósito recebido, perfil de pagamentos liberado

---

## 🚀 Play Billing (híbrido: Play Billing no app + Mercado Pago na web)
| Peça | O que é | Status |
|---|---|---|
| 1 | Cliente (detecção TWA + compra) | ✅ feito |
| **2** | **Backend que valida a compra no Google** (Google Cloud service account + API) | 👈 **EM ANDAMENTO** |
| 3 | Notificações de renovação (RTDN via Pub/Sub) | depois |
| 4 | Gerar **.aab com billing** (PWABuilder) | depois |
| 5 | Criar produtos de assinatura no Play Console | depois (precisa do banco verificado) |

---

## 📌 DEPOIS do Play Billing (NÃO ESQUECER)
- [ ] **Supabase Pro** (~US$25/mês) — backups diários dos dados, no dia do lançamento
- [ ] Badge oficial **"Disponível no Google Play"** na landing (quando estiver em produção)
- [x] ~~Atualizar **`public/.well-known/assetlinks.json`** com o SHA da chave de assinatura do Google~~ ✅ **FEITO (05/06/2026)**
- [ ] **Banner in-app de opt-in** pros testadores + **mensagem de recrutamento no WhatsApp**
- [ ] Verificar o **1º disparo real do lembrete diário** no horário escolhido (confirmar que está chegando)
- [ ] (Opcional) Limpar os 2 erros de teste no Sentry (Resolve/Delete)

---

## 💡 Observações
- **Mercado Pago:** conta de produção OK, webhook ativo (200 OK). Assinaturas recorrentes funcionam com cartão aprovado de verdade.
- **Speed Insights (Vercel):** deixado pra depois (é pago, US$10/mês) — Web Analytics grátis já está ligado.
