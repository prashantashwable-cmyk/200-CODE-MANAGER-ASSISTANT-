#!/usr/bin/env bash
# A throwaway local Postgres for the database tests (no Docker needed).
# Usage: scripts/db/local-postgres.sh start|stop   (data lives in $PGLOCAL_DIR, default /tmp/aiec-pg)
# Prints the DATABASE_URL to use. CI uses a postgres service container instead.
set -euo pipefail
DIR="${PGLOCAL_DIR:-/tmp/aiec-pg}"
PORT="${PGLOCAL_PORT:-54329}"
BIN="$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)"
as_pg() { if [ "$(id -u)" = "0" ]; then runuser -u postgres -- "$@"; else "$@"; fi; }
case "${1:-start}" in
  start)
    if [ ! -f "$DIR/PG_VERSION" ]; then
      mkdir -p "$DIR"; [ "$(id -u)" = "0" ] && chown postgres "$DIR"
      as_pg "$BIN/initdb" -D "$DIR" -U postgres --auth=trust >/dev/null
    fi
    as_pg "$BIN/pg_ctl" -D "$DIR" -o "-p $PORT -k /tmp -c listen_addresses=localhost" -l "$DIR/log" -w status >/dev/null 2>&1 \
      || as_pg "$BIN/pg_ctl" -D "$DIR" -o "-p $PORT -k /tmp -c listen_addresses=localhost" -l "$DIR/log" -w start >/dev/null
    echo "postgres://postgres@localhost:$PORT/postgres"
    ;;
  stop)
    as_pg "$BIN/pg_ctl" -D "$DIR" -m fast stop >/dev/null || true
    ;;
esac
