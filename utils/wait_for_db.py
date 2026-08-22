#!/usr/bin/env python3
import logging
import os
import sys
import time
from urllib.parse import parse_qs, urlparse

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def parse_database_url(url: str) -> dict:
    parsed = urlparse(url)
    params = {
        "user": parsed.username,
        "password": parsed.password,
        "database": parsed.path.lstrip("/"),
    }
    query_params = parse_qs(parsed.query)
    if "host" in query_params:
        params["host"] = query_params["host"][0]
    elif parsed.hostname:
        params["host"] = parsed.hostname
        params["port"] = str(parsed.port or 5432)
    return params


def check_db_connection() -> bool:
    try:
        import psycopg2
        from psycopg2 import OperationalError

        database_url = os.getenv("DATABASE_URL")
        if database_url:
            conn_params = parse_database_url(database_url)
        else:
            conn_params = {
                "host": os.getenv("POSTGRES_HOST", "postgres"),
                "port": os.getenv("POSTGRES_PORT", "5432"),
                "database": os.getenv("POSTGRES_DB", "sahayak_db"),
                "user": os.getenv("POSTGRES_USER", "sahayak"),
                "password": os.getenv("POSTGRES_PASSWORD", "sahayak"),
            }
        conn_params["connect_timeout"] = 5
        conn_params = {k: v for k, v in conn_params.items() if v is not None}
        conn = psycopg2.connect(**conn_params)
        conn.close()
        return True
    except OperationalError:
        return False
    except Exception as exc:
        logger.error("Unexpected database check error: %s", exc)
        return False


def wait_for_database(max_retries: int = 30, delay: float = 2) -> bool:
    logger.info("Waiting for PostgreSQL...")
    for attempt in range(max_retries):
        if check_db_connection():
            logger.info("PostgreSQL is ready.")
            return True
        wait_time = min(delay * (1.5**attempt), 20)
        logger.info("Not ready yet. Retrying in %.1fs (%s/%s)", wait_time, attempt + 1, max_retries)
        time.sleep(wait_time)
    return False


if __name__ == "__main__":
    if os.getenv("SKIP_DB_WAIT", "").lower() == "true":
        sys.exit(0)
    sys.exit(0 if wait_for_database() else 1)
