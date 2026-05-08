/**
 * Copies the canonical formulary JSON into doctor-web public assets.
 * Canonical source: apps/web/data/cghs-homoeopathic-formulary.json
 *
 * Run: node scripts/build-cghs-homoeopathic-formulary.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const sourcePath = path.join(root, 'apps', 'web', 'data', 'cghs-homoeopathic-formulary.json');
const outPath = path.join(root, 'apps', 'doctor-web', 'public', 'data', 'cghs-homoeopathic-formulary.json');

if (!fs.existsSync(sourcePath)) {
  console.error('Missing canonical formulary:', path.relative(root, sourcePath));
  console.error('Add the file or run: npm run import:cghs-formulary');
  process.exit(1);
}

const raw = fs.readFileSync(sourcePath, 'utf8');
/** @type {{ schemaVersion?: number; entries?: unknown[]; title?: string }} */
let payload;
try {
  payload = JSON.parse(raw);
} catch (e) {
  console.error('Invalid JSON in', sourcePath, e);
  process.exit(1);
}

if (!Array.isArray(payload.entries) || payload.entries.length === 0) {
  console.error('Canonical formulary must have a non-empty `entries` array.');
  process.exit(1);
}

const entryCount = payload.entries.length;
const output = {
  schemaVersion: payload.schemaVersion ?? 1,
  title: payload.title ?? 'CGHS Homoeopathic Formulary',
  description: payload.description,
  sourceFile: 'apps/web/data/cghs-homoeopathic-formulary.json',
  syncedAt: new Date().toISOString(),
  entryCount,
  entries: payload.entries
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');
console.log(`Synced ${entryCount} entries → ${path.relative(root, outPath)}`);
