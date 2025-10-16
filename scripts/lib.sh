#!/usr/bin/env bash
set -euo pipefail

log()  { printf "\033[1;36m[%s]\033[0m %s\n" "$(date -Iseconds)" "$*"; }
ok()   { printf "\033[1;32m[ok]\033[0m %s\n" "$*"; }
warn() { printf "\033[1;33m[warn]\033[0m %s\n" "$*" >&2; }
err()  { printf "\033[1;31m[err]\033[0m %s\n" "$*" >&2; }

require_env() {
  for v in "$@"; do
    if [ -z "${!v:-}" ]; then err "missing env: $v"; exit 1; fi
  done
}

path_add() {
  case ":$PATH:" in
    *":$1:"*) ;; # already there
    *) export PATH="$1:$PATH";;
  esac
}
