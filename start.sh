#!/bin/sh
set -e

echo "Running Prisma migrations..."
node node_modules/.bin/prisma migrate deploy || echo "Migration warning (may already be up to date)"

echo "Starting Next.js server..."
exec node server.js
