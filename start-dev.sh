#!/usr/bin/env bash
set -euo pipefail

# Starts API and Web in separate Terminal tabs (macOS),
# then opens the frontend URL in the default browser.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="${ROOT_DIR}/api"
WEB_DIR="${ROOT_DIR}/web"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"

if ! command -v osascript >/dev/null 2>&1; then
  echo "Erro: osascript nao encontrado. Este script suporta apenas macOS."
  exit 1
fi

if [[ ! -d "${API_DIR}" || ! -d "${WEB_DIR}" ]]; then
  echo "Erro: pastas api/web nao encontradas em: ${ROOT_DIR}"
  exit 1
fi

API_AUTH_OK="false"
if (cd "${API_DIR}" && npx wrangler whoami >/dev/null 2>&1); then
  API_AUTH_OK="true"
fi

osascript - "${API_DIR}" "${WEB_DIR}" "${API_AUTH_OK}" <<'APPLESCRIPT'
on run argv
  set apiDir to item 1 of argv
  set webDir to item 2 of argv
  set apiAuthOk to item 3 of argv

  tell application "Terminal"
    activate
    if (count of windows) is 0 then
      do script ""
    end if

    do script "cd " & quoted form of webDir & " && npm run dev" in window 1
    if apiAuthOk is "true" then
      do script "cd " & quoted form of apiDir & " && npm run dev" in window 1
    else
      do script "cd " & quoted form of apiDir & " && npx wrangler login && npm run dev" in window 1
    end if
  end tell
end run
APPLESCRIPT

# Give Vite a brief head start before opening browser.
sleep 2
open "${FRONTEND_URL}"

echo "API e Web iniciados em abas do Terminal."
echo "Frontend aberto em: ${FRONTEND_URL}"
if [[ "${API_AUTH_OK}" != "true" ]]; then
  echo "Wrangler nao autenticado: uma aba abriu login e iniciara a API apos autenticar."
fi
