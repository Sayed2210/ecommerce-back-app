#!/bin/sh
set -e

echo "Running database migrations..."
node -e "
const { AppDataSource } = require('./dist/ormconfig');
AppDataSource.initialize()
  .then(() => AppDataSource.runMigrations())
  .then(() => { console.log('Migrations complete'); process.exit(0); })
  .catch(err => { console.error('Migration failed (continuing):', err.message); process.exit(0); });
" || true

echo "Starting application..."
exec node dist/main.js
