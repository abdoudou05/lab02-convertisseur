#!/usr/bin/env bash
# Déploiement d'une version sur la VM, exécuté par GitHub Actions via SSH.
#   usage : remote-deploy.sh <sha-du-commit> <chemin-de-l-archive.tgz>
# Chaque version est extraite dans son propre dossier (releases/), puis le lien
# symbolique « current » bascule d'un coup. Si la sonde /health ne confirme pas
# la nouvelle révision, on revient automatiquement à la version précédente.
set -euo pipefail

REV="$1"
ARCHIVE="$2"
APP_DIR=/opt/convertisseur
SERVICE=convertisseur
KEEP=5

RELEASE="$APP_DIR/releases/$(date -u +%Y%m%d%H%M%S)-${REV:0:7}"
PREVIOUS="$(readlink -f "$APP_DIR/current" 2>/dev/null || true)"

echo "==> Extraction dans $RELEASE"
mkdir -p "$RELEASE"
tar -xzf "$ARCHIVE" -C "$RELEASE"
rm -f "$ARCHIVE"

echo "==> Installation des dépendances de production (serveur seulement)"
cd "$RELEASE"
npm ci --omit=dev --workspace server --no-audit --no-fund --loglevel=error

switch_to() {
  ln -sfn "$1" "$APP_DIR/current.tmp"
  mv -Tf "$APP_DIR/current.tmp" "$APP_DIR/current"
  sudo /usr/bin/systemctl restart "$SERVICE"
}

check_revision() {
  for _ in $(seq 1 20); do
    if curl -fsS http://127.0.0.1:4000/health 2>/dev/null | grep -q "\"revision\":\"$1\""; then
      return 0
    fi
    sleep 1
  done
  return 1
}

echo "==> Bascule vers la nouvelle version et redémarrage du service"
switch_to "$RELEASE"

if check_revision "$REV"; then
  echo "==> OK : la révision $REV répond sur /health"
else
  echo "!! ÉCHEC : la révision $REV ne répond pas, retour à la version précédente" >&2
  sudo /usr/bin/journalctl -u "$SERVICE" -n 30 --no-pager >&2 || true
  if [[ -n "$PREVIOUS" && -d "$PREVIOUS" ]]; then
    switch_to "$PREVIOUS"
  fi
  exit 1
fi

echo "==> Nettoyage : conservation des $KEEP dernières versions"
ls -1dt "$APP_DIR"/releases/*/ | tail -n +$((KEEP + 1)) | xargs -r rm -rf
