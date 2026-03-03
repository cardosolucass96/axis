#!/bin/sh
set -e

echo "⏳ Executando migrações..."
node dist/database/migrate.js

echo "🚀 Iniciando servidor..."
node dist/server.js
