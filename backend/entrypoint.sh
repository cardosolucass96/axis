#!/bin/sh
set -e

echo "⏳ Executando migrações..."
npm run migrate

echo "🚀 Iniciando servidor..."
npm run start
