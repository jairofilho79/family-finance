#!/usr/bin/env bash
set -euo pipefail

role="${1:-}"
message="${2:-}"

if [[ -z "$role" || -z "$message" ]]; then
  echo "Uso: ./scripts/chat-turn.sh <user|assistant> \"mensagem\""
  exit 1
fi

if [[ "$role" != "user" && "$role" != "assistant" ]]; then
  echo "Role invalido. Use 'user' ou 'assistant'."
  exit 1
fi

if [[ ! -f MEMORY.md ]]; then
  cat > MEMORY.md <<'EOF'
# MEMORY

Registro cronologico de sessoes e trocas de mensagens deste projeto.
EOF
fi

timestamp="$(date '+%Y-%m-%d %H:%M:%S')"
safe_message="$(printf '%s' "$message" | tr '\n' ' ' | sed -E 's/[[:space:]]+/ /g')"

{
  echo "- [${timestamp}] ${role}: ${safe_message}"
} >> MEMORY.md

git add MEMORY.md
git commit -m "docs(memory): registra troca ${role} em ${timestamp}" >/dev/null 2>&1 || true

echo "Troca registrada em MEMORY.md (${role})."
