#!/usr/bin/env bash
# Sahayak CPGRAMS — one-command production deploy for Ubuntu EC2 (or any Linux VM).
# Usage: clone repo → copy .env.production.example to .env → fill secrets → ./deploy.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

COMPOSE_FILE="$ROOT_DIR/docker-compose.prod.yml"
CADDY_DIR="$ROOT_DIR/deploy"
CADDYFILE="$CADDY_DIR/Caddyfile"
ENV_FILE="$ROOT_DIR/.env"

log()  { printf '\n[%s] %s\n' "$(date +%H:%M:%S)" "$*"; }
die()  { printf '\nERROR: %s\n' "$*" >&2; exit 1; }
warn() { printf '\nWARN: %s\n' "$*" >&2; }

need_sudo() {
  if [ "$(id -u)" -ne 0 ]; then
    if command -v sudo >/dev/null 2>&1; then
      SUDO="sudo"
    else
      die "Run as root or install sudo."
    fi
  else
    SUDO=""
  fi
}

run_root() {
  # shellcheck disable=SC2086
  $SUDO "$@"
}

get_public_ip() {
  local ip=""
  ip="$(curl -sf --max-time 5 http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || true)"
  if [ -z "$ip" ]; then
    ip="$(curl -sf --max-time 5 https://ifconfig.me/ip 2>/dev/null || true)"
  fi
  if [ -z "$ip" ]; then
    ip="$(curl -sf --max-time 5 https://api.ipify.org 2>/dev/null || true)"
  fi
  printf '%s' "$ip"
}

ip_to_sslip_host() {
  printf '%s.sslip.io' "${1//./-}"
}

read_env_value() {
  local key="$1"
  if [ ! -f "$ENV_FILE" ]; then
    return 1
  fi
  grep -E "^${key}=" "$ENV_FILE" | tail -n1 | cut -d= -f2- | sed 's/^["'\''"]//; s/["'\''"]$//' || true
}

set_env_value() {
  local key="$1"
  local value="$2"
  local tmp found=0 line
  tmp="$(mktemp)"
  while IFS= read -r line || [ -n "$line" ]; do
    if [[ "$line" == "${key}="* ]]; then
      printf '%s=%s\n' "$key" "$value"
      found=1
    else
      printf '%s\n' "$line"
    fi
  done < "$ENV_FILE" > "$tmp"
  if [ "$found" -eq 0 ]; then
    printf '%s=%s\n' "$key" "$value" >> "$tmp"
  fi
  mv "$tmp" "$ENV_FILE"
}

require_env_keys() {
  local missing=0
  for key in POSTGRES_PASSWORD JWT_SECRET; do
    local val
    val="$(read_env_value "$key")"
    if [ -z "$val" ]; then
      warn "Missing required .env key: $key"
      missing=1
    fi
  done

  local jwt
  jwt="$(read_env_value JWT_SECRET)"
  if [ "$jwt" = "change-me-to-a-long-random-string" ]; then
    die "Set JWT_SECRET in .env to a long random string (not the example default)."
  fi

  local pg_pass
  pg_pass="$(read_env_value POSTGRES_PASSWORD)"
  if [ "$pg_pass" = "sahayak" ]; then
    warn "POSTGRES_PASSWORD is still the dev default — use a strong password for production."
  fi

  local openai
  openai="$(read_env_value OPENAI_API_KEY)"
  if [ -z "$openai" ]; then
    warn "OPENAI_API_KEY is empty — AI voice/chat will be unavailable during the demo."
  fi

  [ "$missing" -eq 0 ] || die "Fill required keys in .env before deploying."
}

sync_production_env() {
  log "Syncing production environment values"

  set_env_value APP_ENV production
  set_env_value NODE_ENV production
  set_env_value FRONTEND_TARGET prod
  set_env_value LOG_LEVEL "${LOG_LEVEL:-INFO}"
  set_env_value POSTGRES_HOST postgres
  set_env_value POSTGRES_PORT 5432

  local pg_user pg_pass pg_db public_url domain
  pg_user="$(read_env_value POSTGRES_USER)"
  pg_pass="$(read_env_value POSTGRES_PASSWORD)"
  pg_db="$(read_env_value POSTGRES_DB)"
  pg_user="${pg_user:-sahayak}"
  pg_db="${pg_db:-sahayak_db}"

  public_url="$(read_env_value PUBLIC_URL)"
  if [ -z "$public_url" ]; then
    public_url="$(read_env_value FRONTEND_URL)"
  fi
  if [ -z "$public_url" ]; then
    local ip host
    ip="$(get_public_ip)"
    [ -n "$ip" ] || die "Could not detect public IP. Set PUBLIC_URL=https://your-domain in .env"
    host="$(ip_to_sslip_host "$ip")"
    public_url="https://${host}"
    log "Detected public IP $ip → $public_url"
  fi

  # Strip trailing slash
  public_url="${public_url%/}"
  domain="${public_url#https://}"
  domain="${domain#http://}"
  domain="${domain%%/*}"

  set_env_value PUBLIC_URL "$public_url"
  set_env_value FRONTEND_URL "$public_url"
  set_env_value NEXT_PUBLIC_API_URL "$public_url"
  set_env_value DATABASE_URL "$(build_database_url "$pg_user" "$pg_pass" "$pg_db")"

  export SAHAYAK_PUBLIC_URL="$public_url"
  export SAHAYAK_DOMAIN="$domain"
}

build_database_url() {
  local user="$1" pass="$2" db="$3"
  POSTGRES_USER="$user" POSTGRES_PASSWORD="$pass" POSTGRES_DB="$db" python3 - <<'PY'
import os
import urllib.parse

user = urllib.parse.quote(os.environ["POSTGRES_USER"], safe="")
password = urllib.parse.quote(os.environ["POSTGRES_PASSWORD"], safe="")
db = os.environ["POSTGRES_DB"]
print(f"postgresql://{user}:{password}@postgres:5432/{db}")
PY
}

install_docker_if_needed() {
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    log "Docker already installed"
    return 0
  fi

  log "Installing Docker Engine + Compose plugin"
  run_root apt-get update -qq
  run_root apt-get install -y ca-certificates curl gnupg
  run_root install -m 0755 -d /etc/apt/keyrings
  if [ ! -f /etc/apt/keyrings/docker.asc ]; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /tmp/docker.asc
    run_root mv /tmp/docker.asc /etc/apt/keyrings/docker.asc
    run_root chmod a+r /etc/apt/keyrings/docker.asc
  fi
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | run_root tee /etc/apt/sources.list.d/docker.list >/dev/null
  run_root apt-get update -qq
  run_root apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  run_root systemctl enable --now docker

  if [ -n "$SUDO" ]; then
    run_root usermod -aG docker "$USER" || true
    warn "Added $USER to docker group. If 'docker' permission fails, run: newgrp docker"
  fi
}

configure_firewall() {
  if command -v ufw >/dev/null 2>&1 && run_root ufw status 2>/dev/null | grep -q "Status: active"; then
    log "Opening UFW ports 22, 80, 443"
    run_root ufw allow 22/tcp || true
    run_root ufw allow 80/tcp || true
    run_root ufw allow 443/tcp || true
  fi
}

write_caddyfile() {
  mkdir -p "$CADDY_DIR"
  log "Writing Caddyfile for $SAHAYAK_DOMAIN"
  cat > "$CADDYFILE" <<EOF
${SAHAYAK_DOMAIN} {
	encode gzip

	@api path /api/*
	handle @api {
		reverse_proxy backend:8000
	}

	handle {
		reverse_proxy frontend:3000
	}
}
EOF
}

write_compose_file() {
  log "Writing docker-compose.prod.yml"
  cat > "$COMPOSE_FILE" <<'EOF'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-sahayak}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-sahayak_db}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - sahayak-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-sahayak} -d ${POSTGRES_DB:-sahayak_db}"]
      interval: 10s
      timeout: 5s
      retries: 8

  backend:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      APP_ENV: production
    env_file:
      - .env
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - sahayak-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8000/api/health || exit 1"]
      interval: 15s
      timeout: 10s
      retries: 8
      start_period: 60s

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: prod
      args:
        NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - sahayak-network
    restart: unless-stopped

  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./deploy/Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - frontend
      - backend
    networks:
      - sahayak-network
    restart: unless-stopped

volumes:
  postgres_data:
  caddy_data:
  caddy_config:

networks:
  sahayak-network:
    driver: bridge
EOF
}

compose() {
  local cmd=(docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@")
  if docker info >/dev/null 2>&1; then
    "${cmd[@]}"
  else
    run_root "${cmd[@]}"
  fi
}

build_and_start() {
  log "Building and starting containers (first run may take several minutes)"
  compose up -d --build
}

wait_for_health() {
  log "Waiting for API health (up to 4 minutes)"
  local i url
  url="${SAHAYAK_PUBLIC_URL}/api/health"
  for i in $(seq 1 48); do
    if curl -kfsS --max-time 5 "$url" >/dev/null 2>&1; then
      log "API is healthy"
      return 0
    fi
    if compose ps --status running 2>/dev/null | grep -q backend && \
       compose exec -T backend curl -fsS http://localhost:8000/api/health >/dev/null 2>&1; then
      log "Backend healthy; waiting for HTTPS proxy..."
    fi
    sleep 5
  done
  warn "Health check timed out. Inspect logs: docker compose -f docker-compose.prod.yml logs -f"
  return 1
}

print_summary() {
  cat <<EOF

================================================================================
  Sahayak CPGRAMS is deployed
================================================================================

  Live URL:     ${SAHAYAK_PUBLIC_URL}
  API health:   ${SAHAYAK_PUBLIC_URL}/api/health
  API docs:     ${SAHAYAK_PUBLIC_URL}/api/docs

  Demo citizen: ${SAHAYAK_PUBLIC_URL}/auth/signin
                mobile 9876543210  password sahayak  OTP 123456

  Demo officer: ${SAHAYAK_PUBLIC_URL}/admin/signin
                mobile 9111111111  password sahayak

  Admin desk:   mobile 9999999999  password (ADMIN_PASSWORD from .env)

  Logs:         docker compose -f docker-compose.prod.yml logs -f
  Restart:      docker compose -f docker-compose.prod.yml up -d --build
  Teardown:     docker compose -f docker-compose.prod.yml down -v
                then terminate EC2 + release Elastic IP in AWS Console

================================================================================
EOF
}

write_deploy_marker() {
  if git -C "$ROOT_DIR" rev-parse HEAD >/dev/null 2>&1; then
    git -C "$ROOT_DIR" rev-parse HEAD > "$ROOT_DIR/.last-deploy-commit"
  fi
}

main() {
  log "Sahayak production deploy"
  need_sudo

  [ -f "$ENV_FILE" ] || die "Missing .env — run: cp .env.production.example .env && nano .env"

  require_env_keys
  sync_production_env
  install_docker_if_needed
  configure_firewall
  write_caddyfile
  write_compose_file
  build_and_start
  wait_for_health || true
  write_deploy_marker
  print_summary
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi
