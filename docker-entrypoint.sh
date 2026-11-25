#!/bin/sh
set -e

echo "Starting BuildTrack Container..."

# Push schema to PostgreSQL database
echo "Synchronizing Prisma database schema..."
npx prisma db push --skip-generate || true

# Execute seed if needed
if [ "$SEED_DB" = "true" ]; then
  echo "Seeding construction project intelligence dataset..."
  npm run seed || true
fi

echo "Launching Next.js application server..."
exec "$@"

