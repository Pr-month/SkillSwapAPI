#!/bin/bash
set -e
pg_restore --verbose --clean --no-acl --no-owner -U "$POSTGRES_USER" -d "$POSTGRES_DB" /docker-entrypoint-initdb.d/dump.custom
