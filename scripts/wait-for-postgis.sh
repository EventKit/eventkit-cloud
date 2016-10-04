#!/bin/bash

set -e

connectionString="$1"
shift
cmd="$@"

until psql "$connectionString" -c '\l'; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

>&2 echo "Postgres is up - executing command"
exec $cmd
