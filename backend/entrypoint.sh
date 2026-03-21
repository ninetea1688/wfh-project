#!/bin/sh
set -e

echo "Waiting for database to be ready..."
until node -e "
const net = require('net');
const s = net.createConnection(3306, 'mysql');
s.on('connect', () => { s.destroy(); process.exit(0); });
s.on('error', () => { s.destroy(); process.exit(1); });
" 2>/dev/null; do
  echo "Database not ready, retrying in 3 seconds..."
  sleep 3
done

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Running database seed..."
npx prisma db seed

echo "Starting backend server..."
exec node dist/index.js
