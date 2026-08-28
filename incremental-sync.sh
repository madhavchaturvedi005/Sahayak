#!/usr/bin/env bash
# Sahayak CPGRAMS — pull latest GitHub changes and redeploy only what changed.
# Usage (on the server, after initial ./deploy.sh): ./incremental-sync.sh
#
# Keeps Postgres data. Does not reinstall Docker or wipe volumes.
# Backend restart runs DB migrations automatically (start.sh → alembic upgrade head).

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# Reuse deploy helpers (compose, env sync, health checks, etc.)
# shellcheck source=deploy.sh
source "$ROOT_DIR/deploy.sh"

MARKER="$ROOT_DIR/.last-deploy-commit"
GIT_REMOTE="${GIT_REMOTE:-origin}"

detect_services_to_rebuild() {
  local changed="$1"
  local -a services=()
  local need_compose=0
  local need_caddy=0

  if [ -z "$changed" ]; then
    NEED_COMPOSE=0
    NEED_CADDY=0
    return 0
  fi

  while IFS= read -r file; do
    [ -n "$file" ] || continue
    case "$file" in
      app/*|scripts/*|alembic/*|utils/*|packages/*|Dockerfile|start.sh|alembic.ini)
        services+=("backend")
        ;;
      frontend/*)
        services+=("frontend")
        ;;
      deploy.sh|docker-compose.prod.yml)
        need_compose=1
        services+=("backend" "frontend")
        ;;
      deploy/Caddyfile)
        need_caddy=1
        ;;
    esac
  done <<< "$changed"

  if [ "$need_compose" -eq 1 ] || [ "$need_caddy" -eq 1 ]; then
    services+=("caddy")
  fi

  NEED_COMPOSE=$need_compose
  NEED_CADDY=$need_caddy

  if [ ${#services[@]} -eq 0 ]; then
    return 0
  fi

  local deduped
  deduped="$(printf '%s\n' "${services[@]}" | awk '!seen[$0]++')"
  while IFS= read -r svc; do
    [ -n "$svc" ] && DETECTED_SERVICES+=("$svc")
  done <<< "$deduped"
}

prepare_sync_artifacts() {
  if [ "${NEED_COMPOSE:-0}" -eq 1 ]; then
    write_compose_file
  fi
  if [ "${NEED_CADDY:-0}" -eq 1 ] || [ "${NEED_COMPOSE:-0}" -eq 1 ]; then
    sync_production_env
    write_caddyfile
  fi
}

rebuild_services() {
  local -a services=("$@")
  local -a filtered=()
  local svc

  for svc in "${services[@]}"; do
    [ -n "$svc" ] && filtered+=("$svc")
  done

  if [ ${#filtered[@]} -eq 0 ]; then
    return 0
  fi

  log "Rebuilding and restarting: ${filtered[*]}"
  compose up -d --build "${filtered[@]}"
}

print_sync_summary() {
  local from_rev="$1" to_rev="$2" rebuilt="$3"
  cat <<EOF

================================================================================
  Sahayak sync complete
================================================================================

  Git:          ${from_rev:0:7} → ${to_rev:0:7}
  Rebuilt:      ${rebuilt:-none (docs/config only)}
  Live URL:     ${SAHAYAK_PUBLIC_URL}

  API health:   ${SAHAYAK_PUBLIC_URL}/api/health
  Logs:         docker compose -f docker-compose.prod.yml logs -f backend frontend

================================================================================
EOF
}

main() {
  log "Sahayak incremental sync"
  need_sudo

  [ -f "$ENV_FILE" ] || die "Missing .env — run ./deploy.sh first"
  [ -f "$COMPOSE_FILE" ] || die "Missing docker-compose.prod.yml — run ./deploy.sh first"
  command -v git >/dev/null 2>&1 || die "git is not installed"

  if ! git -C "$ROOT_DIR" rev-parse HEAD >/dev/null 2>&1; then
    die "This folder is not a git repo. Clone from GitHub first."
  fi

  require_env_keys
  sync_production_env

  local base_rev head_rev changed rebuilt
  local -a services=()
  DETECTED_SERVICES=()
  NEED_COMPOSE=0
  NEED_CADDY=0

  head_rev="$(git -C "$ROOT_DIR" rev-parse HEAD)"
  base_rev="$(cat "$MARKER" 2>/dev/null || echo "$head_rev")"

  log "Fetching latest from ${GIT_REMOTE}/${BRANCH} ($(git -C "$ROOT_DIR" branch --show-current))"
  git -C "$ROOT_DIR" fetch "$GIT_REMOTE" "$BRANCH" \
    || die "git fetch failed — check network and repo access"

  if ! git -C "$ROOT_DIR" diff --quiet HEAD 2>/dev/null \
    || ! git -C "$ROOT_DIR" diff --cached --quiet HEAD 2>/dev/null; then
    warn "Local edits to tracked files will be replaced by GitHub ( .env is kept )"
  fi

  git -C "$ROOT_DIR" reset --hard "$GIT_REMOTE/$BRANCH" \
    || die "git reset failed — fix the repo on the server, then rerun ./incremental-sync.sh"

  head_rev="$(git -C "$ROOT_DIR" rev-parse HEAD)"

  if [ "$base_rev" = "$head_rev" ]; then
    log "Already up to date at ${head_rev:0:7}"
    print_sync_summary "$base_rev" "$head_rev" "none"
    exit 0
  fi

  changed="$(git -C "$ROOT_DIR" diff --name-only "$base_rev" "$head_rev")"
  log "Changed files since last deploy:"
  printf '%s\n' "${changed:-"(none)"}" >&2

  detect_services_to_rebuild "$changed"
  services=("${DETECTED_SERVICES[@]:-}")

  if [ ${#services[@]} -eq 0 ]; then
    log "No application changes — skipping container rebuild"
    rebuilt="none"
  else
    prepare_sync_artifacts
    rebuilt="${services[*]}"
    rebuild_services "${services[@]}"
    wait_for_health || true
  fi

  write_deploy_marker
  print_sync_summary "$base_rev" "$head_rev" "$rebuilt"
}

main "$@"
