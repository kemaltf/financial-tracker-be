#!/bin/sh
set -eu

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_WAIT_TIMEOUT_SECONDS="${DB_WAIT_TIMEOUT_SECONDS:-60}"
export DB_HOST DB_PORT DB_WAIT_TIMEOUT_SECONDS

node <<'NODE'
const net = require('node:net');
const host = process.env.DB_HOST || 'localhost';
const port = Number(process.env.DB_PORT || 3306);
const timeoutSeconds = Number(process.env.DB_WAIT_TIMEOUT_SECONDS || 60);
const startedAt = Date.now();

function check() {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const finish = (ready) => { socket.destroy(); resolve(ready); };
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
    socket.setTimeout(1000, () => finish(false));
  });
}

(async () => {
  process.stdout.write(`[api] waiting for database ${host}:${port}...\n`);
  while (!(await check())) {
    if (Date.now() - startedAt > timeoutSeconds * 1000) {
      process.stderr.write(`[api] database was not reachable within ${timeoutSeconds}s\n`);
      process.exit(1);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  process.stdout.write('[api] database is reachable\n');
})();
NODE

echo "[api] running migrations..."
npm run db:runMigration

echo "[api] starting server..."
exec npm run start:prod
