#!/bin/sh
set -e

echo "🔄 Syncing database schema..."
npx prisma db push --accept-data-loss --skip-generate || echo "⚠️  prisma db push failed — continuing anyway"

echo "🚀 Starting Next.js server..."
exec node server.js
