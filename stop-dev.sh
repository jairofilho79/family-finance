#!/usr/bin/env bash
set -euo pipefail

# Stops common dev servers used by this project:
# - Vite (web)
# - Wrangler dev (api)

PIDS=()

while IFS= read -r pid; do
  [[ -n "${pid}" ]] && PIDS+=("${pid}")
done < <(pgrep -f "vite|wrangler dev" || true)

if [[ ${#PIDS[@]} -eq 0 ]]; then
  echo "Nenhum processo de dev (vite/wrangler dev) encontrado."
  exit 0
fi

echo "Encerrando processos: ${PIDS[*]}"
kill "${PIDS[@]}" || true

sleep 1

REMAINING=()
while IFS= read -r pid; do
  [[ -n "${pid}" ]] && REMAINING+=("${pid}")
done < <(pgrep -f "vite|wrangler dev" || true)

if [[ ${#REMAINING[@]} -gt 0 ]]; then
  echo "Forcando encerramento: ${REMAINING[*]}"
  kill -9 "${REMAINING[@]}" || true
fi

echo "Processos de dev encerrados."
