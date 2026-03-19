#!/usr/bin/env bash
set -euo pipefail

initial_message="${1:-sessao}"
lower="$(printf '%s' "$initial_message" | tr '[:upper:]' '[:lower:]')"

infer_type() {
  case "$lower" in
    *hotfix*|*urgente*|*incidente*|*producao*)
      echo "hotfix"
      ;;
    *bug*|*erro*|*corrig*|*fix*)
      echo "fix"
      ;;
    *doc*|*readme*|*guia*|*walkthrough*)
      echo "docs"
      ;;
    *refactor*|*chore*|*limpeza*|*infra*|*deps*)
      echo "chore"
      ;;
    *)
      echo "feature"
      ;;
  esac
}

slug="$(printf '%s' "$lower" | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//; s/-+/-/g')"
slug="${slug:0:36}"
if [[ -z "$slug" ]]; then
  slug="sessao"
fi

branch_type="$(infer_type)"
timestamp="$(date '+%Y%m%d-%H%M%S')"
branch_name="${branch_type}/chat-${timestamp}-${slug}"

current_branch="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$current_branch" == "$branch_name" ]]; then
  echo "Ja esta na branch: $branch_name"
else
  if git show-ref --verify --quiet "refs/heads/$branch_name"; then
    git checkout "$branch_name"
  else
    git checkout -b "$branch_name"
  fi
fi

if [[ ! -f MEMORY.md ]]; then
  cat > MEMORY.md <<'EOF'
# MEMORY

Registro cronologico de sessoes e trocas de mensagens deste projeto.
EOF
fi

{
  echo ""
  echo "## Sessao ${timestamp}"
  echo "- Branch: \`${branch_name}\`"
  echo "- Objetivo inicial: ${initial_message}"
} >> MEMORY.md

git add MEMORY.md
git commit -m "docs(memory): inicia sessao ${timestamp}" >/dev/null 2>&1 || true

echo "Sessao iniciada na branch: ${branch_name}"
