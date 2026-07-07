#!/bin/sh
set -e

echo "Running Prisma migrations..."
node /app/node_modules/prisma/build/index.js migrate deploy || echo "Migration warning (may already be up to date)"

echo "Starting Next.js server..."
exec node server.js
