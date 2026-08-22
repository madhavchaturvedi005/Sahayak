.PHONY: help up down logs-be logs-fe reset-db migrate-create migrate-up migrate-down env

help:
	@echo "Sahayak CPGRAMS"
	@echo "  make env            Copy .env.example to .env if missing"
	@echo "  make up             Start Postgres, API, and frontend"
	@echo "  make down           Stop all services"
	@echo "  make logs-be        Tail backend logs"
	@echo "  make logs-fe        Tail frontend logs"
	@echo "  make reset-db       Re-run migrations and seed"
	@echo "  make migrate-up     Apply pending migrations"
	@echo "  make migrate-create MSG='desc'  Create a new migration"

env:
	@test -f .env || cp .env.example .env
	@echo ".env is ready"

up: env
	docker compose up --build -d

down:
	docker compose down

logs-be:
	docker compose logs -f backend

logs-fe:
	docker compose logs -f frontend

reset-db:
	docker compose exec backend alembic upgrade head
	docker compose exec backend python scripts/seed.py

migrate-up:
	docker compose exec backend alembic upgrade head

migrate-down:
	docker compose exec backend alembic downgrade -1

migrate-create:
	@if [ -z "$(MSG)" ]; then echo "Usage: make migrate-create MSG='description'"; exit 1; fi
	docker compose exec backend alembic revision --autogenerate -m "$(MSG)"
