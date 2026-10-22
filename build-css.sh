#!/usr/bin/env bash
# ============================================================
# build-css.sh — compila scss/ -> css/ (dart-sass via npx)
# O servidor NÃO precisa de sass: os .css compilados vão no repo.
# Uso:  ./build-css.sh          (compila tudo)
#       ./build-css.sh --watch  (recompila ao salvar)
# ============================================================
set -euo pipefail
cd "$(dirname "$0")"

SASS="npx --yes sass@1.77.8 --no-source-map --style=expanded"

INPUTS=(
  "scss/base.scss:css/base.css"
  "scss/tabela.scss:css/tabela.css"
  "scss/midia.scss:css/midia-anim.css"
  "scss/controle.scss:css/controle.css"
  "scss/controle-desktop.scss:css/controle-desktop.css"
  "scss/controle-mobile.scss:css/controle-mobile.css"
  "scss/themes/laliga.scss:css/laliga.css"
  "scss/themes/colorido.scss:css/colorido.css"
  "scss/themes/simples.scss:css/simples.css"
)

if [[ "${1:-}" == "--watch" ]]; then
  exec $SASS --watch "${INPUTS[@]}"
fi

$SASS "${INPUTS[@]}"
echo "CSS compilado: ${#INPUTS[@]} arquivos."
