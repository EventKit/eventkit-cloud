#!/bin/bash

set -e

connectionString="$1"
shift
cmd="$@"

until psql "$connectionString" -c '\q'; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

exec $cmd
