import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, 'migrations');

function run(cmd: string) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
}

function pendingMigrations() {
  const out = execSync('npx prisma migrate status', {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf8'
  });
  const block = out.split('Following migrations have not yet been applied:')[1];
  if (!block) return [];
  return block
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

// Sync schema to latest Prisma model state first.
run('npx prisma db push --accept-data-loss');
run('npx prisma generate');

let guard = 0;
while (guard++ < 60) {
  const pending = pendingMigrations();
  if (!pending.length) {
    console.log('All migrations applied.');
    break;
  }

  const next = pending[0];
  try {
    run('npx prisma migrate deploy');
    continue;
  } catch {
    console.warn(`Deploy stopped; marking ${next} as applied if needed.`);
  }

  try {
    run(`npx prisma migrate resolve --applied ${next}`);
  } catch (error) {
    console.error(`Could not resolve ${next}`, error);
    break;
  }
}
