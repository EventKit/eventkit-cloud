#!/bin/bash

set -e

host="$1"
username="$2"
shift
cmd="$@"

until psql -h "$host" -U "$username" -c '\l'; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

>&2 echo "Postgres is up - executing command"
exec $cmd
