#!/usr/bin/env node
/**
 * One-shot local bootstrap for the Dispute Triage System.
 *
 * Creates the server env file (if missing), generates the Prisma client,
 * applies migrations to create the SQLite database, and seeds development
 * data. Safe to re-run — migrations and seeding are idempotent.
 *
 * Usage: npm run setup
 */
import { existsSync, copyFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const ENV_PATH = 'server/.env';
const ENV_EXAMPLE = 'server/.env.example';

function run(command) {
  console.log(`\n$ ${command}`);
  execSync(command, { stdio: 'inherit' });
}

if (!existsSync(ENV_PATH)) {
  copyFileSync(ENV_EXAMPLE, ENV_PATH);
  console.log(`Created ${ENV_PATH} from ${ENV_EXAMPLE}`);
} else {
  console.log(`${ENV_PATH} already exists — leaving it untouched`);
}

run('npm run db:generate --workspace=server');
run('npm run db:migrate:deploy --workspace=server');
run('npm run db:seed --workspace=server');

console.log('\n✅ Setup complete. Start the app with: npm run dev');
