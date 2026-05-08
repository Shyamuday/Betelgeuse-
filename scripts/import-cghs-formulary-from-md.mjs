/**
 * One-off / maintenance: parse legacy markdown and write canonical JSON.
 * Output: apps/web/data/cghs-homoeopathic-formulary.json
 *
 * Run: npm run import:cghs-formulary
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const mdCandidates = [
  path.join(root, 'docs', 'archive', 'homeopathic-medicine.md'),
  path.join(root, 'apps', 'web', 'homeopathic-medicine.md'),
  path.join(root, 'apps', 'web', 'homeopathic-medicne.md')
];
const src = mdCandidates.find((p) => fs.existsSync(p));
if (!src) {
  console.error('No markdown source found. Tried:', mdCandidates);
  process.exit(1);
}

const out = path.join(root, 'apps', 'web', 'data', 'cghs-homoeopathic-formulary.json');

const text = fs.readFileSync(src, 'utf8');
const lines = text.split(/\r?\n/);

function skipLine(t) {
  if (!t) return true;
  if (/^Group\s+"/i.test(t)) return true;
  if (/^List of Medicines/i.test(t)) return true;
  if (/^\d+(st|nd|th)\s+Edition/i.test(t)) return true;
  if (/^Sl\.|^No\.|^NIV\.|^Name of Medicine|^Potency A\/U/i.test(t)) return true;
  return false;
}

const merged = [];
let acc = '';

function normalizeAcc(s) {
  return s
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b([A-Z])\s+-\s*(\d+)\s+/g, '$1-$2 ')
    .replace(/\b([A-Z])-\s+(\d+)\s+/g, '$1-$2 ');
}

function tryFlush() {
  let s = normalizeAcc(acc);
  s = s.replace(/\b([A-Z])-\s+(\d+)\s+/g, '$1-$2 ');
  acc = s;
  if (/^\d+\s+[A-Z]-\d+\s+.+\s+\S+\s+\S+$/i.test(acc)) {
    merged.push(acc);
    acc = '';
    return true;
  }
  return false;
}

for (const line of lines) {
  const t = line.trim();
  if (skipLine(t)) {
    if (acc) {
      if (!tryFlush()) merged.push(normalizeAcc(acc));
      acc = '';
    }
    continue;
  }
  if (!t) continue;

  acc = acc ? `${acc} ${t}` : t;
  tryFlush();
}

if (acc) {
  if (!tryFlush()) merged.push(normalizeAcc(acc));
}

const potencyRe = /^(?:Q|[0-9]+[xX]|[1-9][0-9]*M|CM|LM|\d+)$/;

function parseRecord(line) {
  const m = line.match(/^(\d+)\s+([A-Z]-\d+)\s+(.+)$/i);
  if (!m) return null;
  const code = `${m[2][0].toUpperCase()}-${m[2].slice(2)}`;
  let rest = m[3].trim().replace(/\s+/g, ' ');
  rest = rest.replace(/\s*\*+\s*$/, '').trim();
  const tokens = rest.split(/\s+/);
  if (tokens.length < 2) return null;

  const last = tokens[tokens.length - 1].replace(/\*_+$/, '');
  const secondLast = tokens[tokens.length - 2]?.replace(/\*_+$/, '');

  let potency = '';
  let amount = last;
  let nameEnd = tokens.length - 1;

  if (
    tokens.length >= 2 &&
    secondLast &&
    (potencyRe.test(secondLast) || /^[0-9]+[mM]$/.test(secondLast))
  ) {
    potency = secondLast;
    amount = last;
    nameEnd = tokens.length - 2;
  }

  const name = tokens.slice(0, nameEnd).join(' ').trim();
  if (!name) return null;

  return {
    code,
    name,
    potency: potency || '',
    amount,
    label: `${name}${potency ? ` · ${potency}` : ''} · ${amount} (${code})`
  };
}

const entries = [];
const seen = new Set();
for (const line of merged) {
  const rec = parseRecord(line);
  if (!rec) continue;
  const key = `${rec.code}|${rec.name}|${rec.potency}|${rec.amount}`;
  if (seen.has(key)) continue;
  seen.add(key);
  entries.push(rec);
}

entries.sort((a, b) => {
  const ga = a.code[0];
  const gb = b.code[0];
  if (ga !== gb) return ga.localeCompare(gb);
  const na = parseInt(a.code.slice(2), 10);
  const nb = parseInt(b.code.slice(2), 10);
  return na - nb;
});

fs.mkdirSync(path.dirname(out), { recursive: true });
const payload = {
  schemaVersion: 1,
  title: 'CGHS Homoeopathic Formulary (22nd Edition)',
  description:
    'Canonical formulary list for the doctor app. Edit entries here after import, or adjust markdown and re-run npm run import:cghs-formulary.',
  sourceFile: 'apps/web/data/cghs-homoeopathic-formulary.json',
  migratedFromMarkdown: path.relative(root, src).replace(/\\/g, '/'),
  lastUpdated: new Date().toISOString().slice(0, 10),
  entryCount: entries.length,
  entries
};
fs.writeFileSync(out, JSON.stringify(payload, null, 2), 'utf8');
console.log(`Imported ${entries.length} entries from ${path.relative(root, src)} → ${path.relative(root, out)}`);
