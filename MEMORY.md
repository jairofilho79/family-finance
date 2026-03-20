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
