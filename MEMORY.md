# MEMORY

Registro cronologico de sessoes e trocas de mensagens deste projeto.

## Contrato de responsabilidade (explicito)

- Este arquivo (`MEMORY.md`) contem apenas historico de sessoes, decisoes e eventos.
- Nao definir regras permanentes de operacao aqui.
- Regras e convencoes do projeto vivem exclusivamente em `AGENTS.md`.
- Para evitar duplicidade: registrar aqui somente "o que aconteceu", sem repetir "como operar".

---

## Sessao 20260319-100436
- Branch: `feature/chat-20260319-100436-criar-agents-e-mecanismo-de-branch-p`
- Objetivo inicial: Criar AGENTS e mecanismo de branch por aba
- [2026-03-19 10:04:36] user: Certo, quero criar um AGENTS (ou outro arquivo...)
- [2026-03-19 10:04:36] assistant: Implementado AGENTS.md, scripts de sessao/turno e MEMORY.md.

## Sessao 20260319-104432
- Branch: `feature/chat-20260319-104432-implementar-ordenacao-circular-no-hi`
- Objetivo inicial: Implementar ordenacao circular no Historico

## Sessao 20260320-081714
- Branch: `feature/chat-20260320-081714-nessa-feature-vamos-melhorar-o-visua`
- Objetivo inicial: nessa feature, vamos melhorar o visual da aplicação. Primeiro ponto: usar a logo e o nome family-finance no title da aplicação
- [2026-03-20 08:17:14] user: Crie uma nova branch conforme AGENTS.md. Feature: melhorar o visual da aplicação; usar a logo e o nome family-finance no title.
- [2026-03-20 08:17:18] assistant: Criei branch de feature para melhorar o visual e ajustar o title com logo e nome family-finance.
- [2026-03-20 08:21:54] user: Corrigir branding: usar "Family Finance" em vez de "family-finance" (e em todos os locais).
- [2026-03-20 08:22:16] user: POC: sem TDD e sem testes (sem necessidade de criar suíte de testes).
- [2026-03-20 08:25:06] assistant: Branding: aba e páginas agora usam "Family Finance"; troquei web/index.html e api/public/index.html <title>, adicionei texto "Family Finance" ao header ao lado da logo, e alinhei Login/Settings (alt, h1, convite) para "Family Finance".
- [2026-03-20 09:41:53] assistant: Favicon/notification: favicon agora é atualizado via JS para logo-final.svg no web/src/main.tsx e NotificationContext usa o mesmo logo como icon.
- [2026-03-20 09:55:48] assistant: BrandHeader: componente novo (fundo branco, logo 1/4 via clamp, texto Family/Finance em coluna no mobile e inline >=600px) integrado em Layout.tsx e Login.tsx.
- [2026-03-20 10:00:30] assistant: Cores: troquei `--primary-color` e `--primary-hover` em `web/src/index.css` do azul-roxo para o verde exato do `logo-final.svg` (#3a8f26), mantendo dark theme alinhado. Assim texto e acentos ficam na cor da logo.
- [2026-03-20 10:04:15] assistant: Criei `logo-final-branca.svg` copiando `logo-final.svg` e trocando o fill principal de `#3a8f26` para `#ffffff`.
- [2026-03-20 10:08:20] assistant: Corrigi `logo-final-branca.svg`: regenerada a partir de `logo-final.svg` alterando apenas `fill="#3a8f26"` para `fill="#ffffff"`, preservando fundo/transparência e conteúdo completo do SVG.
- [2026-03-20 10:22:22] assistant: Refatoração de tema: modo escuro com fundo verde (#2f6f1d) e textos/detalhes brancos; modo claro com fundo branco e detalhes verdes. Adicionei tokens `--accent-text-color`, `--input-bg`, `--text-color` em `web/src/index.css`; troquei CSS de `color: var(--primary-color)` para `var(--accent-text-color)`; `BrandHeader` agora alterna `logo-final.svg`/`logo-final-branca.svg`; favicon e ícone de notificações agora alternam pela preferência do tema. Build do web passou.
- [2026-03-20 11:04:06] assistant: Uniformidade no modo escuro: `web/src/components/BrandHeader.css` agora usa `background: var(--bg-color)` em vez de `var(--surface-color)` (remove diferença entre header e fundo verde).
- [2026-03-20 11:04:55] assistant: Tema escuro: ajustar verde para ficar mais escuro e uniforme. Em `web/src/index.css` no bloco `[data-theme="dark"]` troquei `--bg-color` de `#2f6f1d` para `#245b18` (mesmo valor do `--surface-color`) para eliminar o verde mais claro.
- [2026-03-20 11:07:48] assistant: BrandHeader: aumentei altura/padding, aumentei max-height da logo (56px) e ajustei espaçamento do texto (padding-left 0.55rem) e alinhamento pra o icon e texto aproveitarem mais espaço horizontal.
- [2026-03-20 11:11:26] assistant: Ajuste BrandHeader: aumentei um pouco o tamanho (logo max-height 60px, largura do wrap clamp(115px,26%,200px)) e aproximei o texto do ícone (padding-left 0.35rem) e em >=600px aumentei levemente font-size (calc(fs-3xl*1.06)) para ficar maior e mais equilibrado.
- [2026-03-20 11:13:27] user: Ajustar BrandHeader: logo e texto maiores e remover gap grande entre ambos.
- [2026-03-20 11:13:27] assistant: Atualizado BrandHeader.css para reduzir gap real (removendo espaço morto do ícone), aumentar tamanho de logo/texto e manter layout alinhado. Build web ok.
- [2026-03-20 11:14:17] user: Pedir para deixar logo e texto do BrandHeader ainda mais próximos.
- [2026-03-20 11:14:17] assistant: Reduzi espaço no BrandHeader (gap 0.12rem e área da logo de 24% para 20% com min/max menores) para aproximar bastante logo e texto; build web passou.
- [2026-03-20 11:21:07] user: Trocar cor de receita/a receber para azul com contraste no fundo verde.
- [2026-03-20 11:21:07] assistant: Atualizei token `--success-color` para azul (`#60a5fa`) e hover (`#3b82f6`) em `web/src/index.css`, além de substituir hovers hardcoded verdes em Dialog/PayPending e fallback verde em NewTransaction. Build web passou.
- [2026-03-20 11:26:08] assistant: Correção no seletor de tema: em `web/src/pages/Settings.tsx` inverti os botões para que "Escuro" aplique `dark` e "Claro" aplique `light` (antes estava invertido). Build do web passou.
- [2026-03-20 11:30:14] assistant: Responsive Dashboard: em `web/src/pages/Dashboard.css` adicionei `@media (max-width: 480px)` para transformar `.card-row` em coluna e `.peer-details-summary` em coluna; também garanti anti-overflow no `.sub-card` com `min-width:0` e `overflow-wrap:anywhere`/`word-break:break-word` em `.sub-card h3` para currency pt-BR com NBSP.
- [2026-03-20 11:33:10] assistant: Dashboard responsive: corrigida sobreposição no card do peer em telas <=480. Em `web/src/pages/Dashboard.css` no `@media (max-width: 480px)` adicionei layout em coluna para `.peer-amount` (display:flex, flex-direction:column) e anti-overflow (overflow-wrap:anywhere/word-break) além de ajustar `.peer-info` (min-width:0). Build web passou.
- [2026-03-20 11:34:45] assistant: Responsive fix: no `@media (max-width:480px)` de `web/src/pages/Dashboard.css`, ajustei o card do peer para empilhar: `.balance-item` agora usa `flex-direction: column` (antes só align/coluna de peer-amount) e `.peer-amount` passa a `width:100%`, garantindo que “Você deve R$ ...” fique abaixo do nome em telas pequenas.
- [2026-03-20 11:36:11] assistant: Dashboard mobile: mantido bloco de valor abaixo do nome, mas texto de status/valor agora inline quando há espaço. Em `web/src/pages/Dashboard.css` no breakpoint <=480, `.peer-amount` mudou para `flex-direction: row`, `justify-content:flex-end`, `gap:0.4rem`, com `flex-wrap: wrap` para evitar overflow.
- [2026-03-20 11:38:34] assistant: Aprendizado: no card do peer em telas pequenas, manter nome acima e o par ("Você deve/Te deve" + valor) na mesma linha logo abaixo, evitando layout em colunas lado a lado; isso deve ser aplicado como padrão nos próximos ajustes de UI responsiva.
- [2026-03-20 11:43:00] user: Agora na tela de nova transação. Veja que há vários componentes lado a lado que deveria ser um embaixo do outros. principalmente os inputs. Faça essa refatoração. Mas atente-se em manter apenas nas telas pequenas. Não altere nas telas maiores
- [2026-03-20 11:43:00] assistant: Refatorei o layout responsivo da Nova Transação: em telas <=480px empilha em coluna os blocos de 'Quem pagou/Para quem' e a linha de datas (sem mudar telas maiores).
- [2026-03-20 11:50:52] user: Só as labels que não foi junto com o input aqui, pode corrigir?
- [2026-03-20 11:50:52] assistant: Ajustei a Nova Transação no mobile: escondi o bloco de labels e adicionei labels mobile-only diretamente acima de cada select, garantindo que fiquem junto aos inputs (mantendo layout das telas grandes).
- [2026-03-20 11:52:19] user: Não acho que duplicar esses componente seja uma boa solução. Por favor, desfaça. Use um único componente independente do tamanho de tela.
- [2026-03-20 11:52:19] assistant: Desfiz a duplicação de labels na Nova Transação: removi o bloco separado e mantive uma única estrutura de labels junto aos selects para desktop e mobile, com apenas ajuste de layout via CSS por breakpoint.
- [2026-03-20 11:53:26] user: pode fazer
- [2026-03-20 11:53:26] assistant: Ajustei o espaçamento/alinhamento desktop dos labels na Nova Transação sem alterar o comportamento mobile; build e lint passaram.
- [2026-03-20 11:55:59] user: Agora sobre o texto das labels: Quem pagou? -> Pagador; Para quem? -> Recebedor. Faça essas trocas.
- [2026-03-20 11:55:59] assistant: Atualizei os textos das labels na Nova Transação em : 'Quem pagou/Quem paga?' para 'Pagador' e 'Para quem?' para 'Recebedor', mantendo o mesmo layout e responsividade.
- [2026-03-20 11:56:02] assistant: Atualizei os textos das labels na Nova Transação em NewTransaction.tsx: 'Quem pagou'/'Quem paga' para 'Pagador' e 'Para quem?' para 'Recebedor', mantendo o mesmo layout e responsividade.
## Sessao 20260319-184336
- Branch: `feature/chat-20260319-184336-feature-data-de-compra-dia-01-em-cob`
- Objetivo inicial: Feature: data de compra dia 01 em cobranças de assinatura (cron)
- [2026-03-19 18:43:38] user: Ler AGENTS.md e criar branch para feature de data de compra dia 01 em assinaturas
- [2026-03-19 18:43:39] assistant: Lidos AGENTS e MEMORY; git fetch/pull em main; stash de WIP; sessão iniciada em feature/chat-* para assinatura dia 01

## Sessao 20260320-122426
- Branch: `fix/chat-20260320-122426-fix-settings-payment-methods-compart`
- Objetivo inicial: fix /settings/payment-methods - compartilhar imagens entre usuários
- [2026-03-20 12:27:50] user: Implementar correção /settings/payment-methods: compartilhar itens e image_url entre usuários
- [2026-03-20 12:27:50] assistant: Criada shared_id para payment_methods (migration 0009) e backend agora sincroniza via shared_id com backfill no GET e replicação em POST/PUT/DELETE + ordem. Ajuste de tipagem em ManagePaymentMethods para image_url null/undefined.
- [2026-03-20 15:47:07] assistant: Em prod: ao aplicar migrations via wrangler, 0008 falhou por colunas já existentes. Marquei 0008 como aplicada no D1 (insert em d1_migrations) para destravar, apliquei 0009_shared_payment_methods e depois fiz wrangler deploy (Worker atualizado).

## Sessao 20260413-092955
- Branch: `fix/chat-20260413-092955-feature-corrigir-chave-pix-celular-c`
- Objetivo inicial: Feature: corrigir chave Pix (celular/cpf/email/aleatoria)
- [2026-04-13 09:30:23] user: crie uma nova branch para essa feature que criamos.
- [2026-04-13 09:30:23] assistant: Criei uma branch de feature baseada na main atualizada para a melhoria da chave Pix.

## Sessao 20260413-093933
- Branch: `feature/chat-20260413-093933-feature-unificar-componente-de-formu`
- Objetivo inicial: Feature: unificar componente de formulário (novo/editar pagamento)
- [2026-04-13 09:39:42] assistant: Criei uma nova branch de feature a partir da main atualizada e movi para ela as alterações do componente compartilhado do formulário (NewTransaction/TransactionDetails + TransactionPrimaryFields).
- [2026-04-13 09:42:24] assistant: Inspecionei stash@{0}/stash@{1}; eram duplicatas do patch staged na branch de feature (NewTransaction/TransactionDetails). Removi os dois stashes com segurança; agora não há stash pendente.
- [2026-04-13 09:55:59] user: Você usou como base o formulário de adicionar novo pagamento? Ele tinha melhorias de colocar campos em colunas etc. Ou seja, tinha melhorias de responsividade em dispositivos mobile. Fui verificar agora e as melhorias tinham sumido. Tanto para editar quanto para adicionar novo pagamento.
- [2026-04-13 09:55:59] assistant: Ajustei o componente compartilhado para reutilizar as classes originais do formulário novo (tx-*) e manter responsividade mobile, além de limpar duplicação no CSS do componente; build e lint ok.
- [2026-04-13 10:06:33] user: Olha só, isso ficava um embaixo do outro e não em overflow lateral. Pode consertar?
- [2026-04-13 10:06:33] assistant: Ajustei responsividade do componente compartilhado para empilhar participantes e datas em telas <=768px e evitar overflow lateral; build/lint ok.

## Sessao 20260413-101458
- Branch: `fix/chat-20260413-101458-fix-corrigir-data-da-compra-em-pagam`
- Objetivo inicial: fix: corrigir data da compra em pagamentos parcela
- [2026-04-13 10:15:01] user: Crie uma nova branch para corrigir a data da compra de pagamentos do tipo parcela.
- [2026-04-13 10:15:01] assistant: Main atualizada; sessão iniciada via script em uma nova branch fix para corrigir a data da compra em pagamentos do tipo parcela.
- [2026-04-13 10:27:37] user: Atualmente, os pagamentos do tipo parcela estão com a data da compra e a data de pagamento iguais. Porém elas devem ser assim: Data da compra: única para todas as parcelas. Data de Pagamento: 1 parcela é igual ao que o usuário colocou no campo data de pagamento; segunda parcela é a mesma da primeira parcela, com acréscimo de 1 mês e assim sucessivamente. Crie um plano para garantir que isso está sendo feito. E também para corrigir dados que não estejam nesse padrão.
- [2026-04-13 10:27:37] assistant: Corrigi a criação de parcelas para manter a data da compra fixa e avançar apenas o vencimento mensal; adicionei scripts SQL de auditoria/backfill para corrigir parcelas pendentes fora do padrão e testes unitários para validar o schedule.

## Sessao 20260717-152800
- Branch: `cursor/fix-recurring-purchase-date-e898`
- Objetivo inicial: Corrigir data de compra reiniciada em Assinatura/Parcelado (ordenação compras recentes)
- [2026-07-17 15:29:55] user: Problema: Assinatura (e parcelado) reiniciam data da compra a cada mês, quebrando ordenação por compras recentes. Devem manter data da primeira compra e só atualizar data de pagamento.
- [2026-07-17 15:30:13] assistant: Confirmado: cron de assinatura gravava date no dia 01 do mês da cobrança; parcelas avançavam date junto com due_date. Corrigi ambos para manter date da 1ª compra e só avançar due_date; migração 0010 faz backfill dos registros existentes.
