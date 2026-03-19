# Family Finance - Agent Operating Rules

Este arquivo define o comportamento esperado para qualquer agente que atuar neste repositório.

## Contrato de responsabilidade (explicito)

- Este arquivo (`AGENTS.md`) contem apenas regras estaveis de operacao.
- Nao registrar historico de conversas, eventos datados ou diario de sessao aqui.
- Todo historico de execucao deve ficar exclusivamente em `MEMORY.md`.
- Para evitar duplicidade: se for "regra permanente", fica em `AGENTS.md`; se for "fato ocorrido", fica em `MEMORY.md`.

## Bootstrap obrigatorio por sessao

1. Ler `AGENTS.md` e `MEMORY.md` para recuperar contexto historico.
2. Se a branch atual for `main`, criar uma branch de sessao com:
   - `./scripts/chat-session-start.sh "<mensagem-inicial-do-chat>"`
3. Nunca trabalhar direto em `main`.

## Regra sobre walkthrough

- `walkthrough.md` foi usado apenas uma unica vez, durante esta tarefa de criacao da base operacional.
- Nao e obrigatorio reler `walkthrough.md` nas proximas sessoes.

## Convencao de branch por aba de chat

- O nome da branch deve refletir o objetivo inicial da conversa:
  - `feature/...` para funcionalidades
  - `hotfix/...` para correcoes urgentes
  - `fix/...` para correcao comum
  - `docs/...` para documentacao
  - `chore/...` para manutencao/refactor

O script `chat-session-start.sh` faz classificacao automatica por palavras-chave da mensagem inicial.

## Memoria por troca de mensagens

Cada troca relevante deve ser registrada em `MEMORY.md` usando:

- `./scripts/chat-turn.sh user "<mensagem-do-usuario>"`
- `./scripts/chat-turn.sh assistant "<resumo-curto-da-resposta>"`

Objetivo: manter historico auditavel por sessao.

## Commit de memoria

O script `chat-turn.sh` cria commit automatico de `MEMORY.md` para cada registro.
Formato de commit:

- `docs(memory): registra troca <role> em <timestamp>`

## Limites e seguranca

- Nao registrar segredos, tokens ou dados pessoais sensiveis em `MEMORY.md`.
- Se houver informacao sensivel na mensagem, registrar apenas resumo sem dados sensiveis.

## Politica de commit e push

- O agente pode criar commits sem pedir confirmacao ao usuario.
- O agente nao deve executar `git push`.
- O `push` para remoto sera sempre feito manualmente pelo usuario.
