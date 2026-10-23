#!/usr/bin/env sh
# Sobe o app com o servidor embutido do PHP (sem Apache/XAMPP).
# uso: ./servir.sh [porta]      padrao: 8080
PORTA="${1:-8080}"
DIR="$(cd "$(dirname "$0")" && pwd)"
chmod 2>/dev/null; :
echo "painel .... http://127.0.0.1:$PORTA/controle.php"
echo "overlay ... http://127.0.0.1:$PORTA/placar.php?dev=1"
echo "          (Ctrl+C encerra)"
cd "$DIR" && exec php -S "127.0.0.1:$PORTA" -t "$DIR"
