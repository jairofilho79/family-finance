#!/usr/bin/env bash
set -euo pipefail

# Simple concurrent dev runner:
# - Runs API and Web in parallel using `concurrently` (via `npx`)
# - Opens the frontend in the browser once `localhost:5173` responds
# - Calls `stop-dev.sh` at the beginning to avoid port/process conflicts

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="${ROOT_DIR}/api"
WEB_DIR="${ROOT_DIR}/web"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"

if [[ -x "${ROOT_DIR}/stop-dev.sh" ]]; then
  "${ROOT_DIR}/stop-dev.sh" >/dev/null 2>&1 || true
fi

if [[ ! -d "${API_DIR}" || ! -d "${WEB_DIR}" ]]; then
  echo "Erro: pastas api/web nao encontradas em: ${ROOT_DIR}"
  exit 1
fi

if ! command -v npx >/dev/null 2>&1; then
  echo "Erro: npx nao encontrado (precisa Node.js/NPM)."
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "Erro: curl nao encontrado."
  exit 1
fi

cd "${WEB_DIR}"

WEB_CMD="npm run dev"
API_CMD="npm --prefix \"${API_DIR}\" run dev"

echo "Iniciando dev (web + api) com concurrently..."

npx concurrently -k -n "web,api" -c "cyan,magenta" \
  "${WEB_CMD}" \
  "${API_CMD}" &

CONCUR_PID=$!

for _ in $(seq 1 40); do
  if curl -s -o /dev/null "${FRONTEND_URL}/" >/dev/null 2>&1; then
    open "${FRONTEND_URL}" >/dev/null 2>&1 || true
    break
  fi
  sleep 0.5
done

wait "${CONCUR_PID}"
