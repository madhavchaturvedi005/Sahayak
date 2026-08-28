#!/usr/bin/env bash
# Poll GitHub for new commits and run incremental-sync.sh when main moved.
# Install once on EC2 (crontab -e):
#   */5 * * * * /home/ubuntu/Sahayak/auto-sync-cron.sh >> /home/ubuntu/Sahayak/auto-sync.log 2>&1

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

BRANCH="${GIT_BRANCH:-main}"
REMOTE="${GIT_REMOTE:-origin}"
LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')]"

log() { printf '%s %s\n' "$LOG_PREFIX" "$*"; }

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  log "Not a git repo — skipping"
  exit 0
fi

if [ ! -x "$ROOT_DIR/incremental-sync.sh" ] && [ -x "$ROOT_DIR/inc-sync.sh" ]; then
  SYNC_SCRIPT="$ROOT_DIR/inc-sync.sh"
elif [ -x "$ROOT_DIR/incremental-sync.sh" ]; then
  SYNC_SCRIPT="$ROOT_DIR/incremental-sync.sh"
else
  log "No incremental sync script found"
  exit 1
fi

if [ ! -f "$ROOT_DIR/deploy.sh" ] && [ -f "$ROOT_DIR/deploy-paste.sh" ]; then
  cp "$ROOT_DIR/deploy-paste.sh" "$ROOT_DIR/deploy.sh"
  chmod +x "$ROOT_DIR/deploy.sh"
fi

git fetch "$REMOTE" "$BRANCH" --quiet || {
  log "git fetch failed"
  exit 1
}

LOCAL="$(git rev-parse HEAD)"
REMOTE_REV="$(git rev-parse "$REMOTE/$BRANCH")"

if [ "$LOCAL" = "$REMOTE_REV" ]; then
  log "Up to date at ${LOCAL:0:7}"
  exit 0
fi

log "New commits on $REMOTE/$BRANCH (${LOCAL:0:7} → ${REMOTE_REV:0:7}) — syncing"
"$SYNC_SCRIPT"
