#!/usr/bin/env bash
# Permile — status line sponsorisée pour Claude Code.
# Affiche une ligne d'annonceur pendant que l'IA travaille et crédite
# votre portefeuille Permile à chaque impression servie.
#
# Installation (2 minutes) :
#   1. curl -fsSL https://secret-ads-real.vercel.app/statusline.sh -o ~/.claude/permile-statusline.sh
#      chmod +x ~/.claude/permile-statusline.sh
#   2. Dans ~/.claude/settings.json :
#        { "statusLine": { "type": "command", "command": "~/.claude/permile-statusline.sh" } }
#   3. (optionnel) export PERMILE_UID="usr_votre_id"   # sinon un id est généré
#
# Vie privée : ce script n'envoie RIEN de votre contexte — il ignore le
# JSON que Claude Code lui passe et ne fait qu'un GET sortant.

set -u

API="${PERMILE_API:-https://secret-ads-real.vercel.app}"
CACHE_DIR="${TMPDIR:-/tmp}/permile"
CACHE_FILE="$CACHE_DIR/statusline"
UID_FILE="$CACHE_DIR/uid"
TTL_SECONDS="${PERMILE_TTL:-60}" # une impression par minute maximum

mkdir -p "$CACHE_DIR" 2>/dev/null || true

# Le JSON de contexte de Claude Code arrive sur stdin : on le jette.
cat >/dev/null 2>&1 || true

# Identifiant : env > fichier > généré une fois
uid="${PERMILE_UID:-}"
if [ -z "$uid" ] && [ -f "$UID_FILE" ]; then
  uid="$(cat "$UID_FILE" 2>/dev/null || true)"
fi
if [ -z "$uid" ]; then
  uid="usr_cli_$(date +%s | tail -c 7)$RANDOM"
  printf '%s' "$uid" >"$UID_FILE" 2>/dev/null || true
fi

# Auto-limitation : on ne demande une nouvelle pub (= une impression
# facturée) qu'une fois le TTL écoulé ; entre-temps on réaffiche la même.
now="$(date +%s)"
if [ -f "$CACHE_FILE" ]; then
  age=$((now - $(stat -c %Y "$CACHE_FILE" 2>/dev/null || stat -f %m "$CACHE_FILE" 2>/dev/null || echo 0)))
  if [ "$age" -lt "$TTL_SECONDS" ]; then
    cat "$CACHE_FILE"
    exit 0
  fi
fi

line="$(curl -fsS --max-time 2 "$API/api/statusline?llm=claude-code&uid=$uid" 2>/dev/null || true)"
if [ -n "$line" ]; then
  printf '%s' "$line" | tee "$CACHE_FILE"
else
  # Pas de réseau / pas de campagne : statusline discrète, jamais d'erreur
  [ -f "$CACHE_FILE" ] && cat "$CACHE_FILE" || printf 'permile · en attente d'\''annonceur'
fi
