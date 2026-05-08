import fs from 'node:fs';
import path from 'node:path';

const raw = fs.readFileSync(path.join('public-pages.component.ts'), 'utf8');
const s = raw.replace(/\r\n/g, '\n');

function extractTemplate(selector) {
  const i = s.indexOf(`selector: '${selector}'`);
  if (i < 0) throw new Error(`missing ${selector}`);
  const t = s.indexOf('template: `', i);
  if (t < 0) throw new Error('missing template');
  const start = t + 'template: `'.length;
  const end = s.indexOf('  `\n})', start);
  if (end < 0) throw new Error('missing end');
  return s.slice(start, end).replace(/^    /gm, '').trim();
}

fs.mkdirSync('public-pages', { recursive: true });
fs.writeFileSync(
  path.join('public-pages', 'disease-detail.component.html'),
  `${extractTemplate('app-disease-detail')}\n`
);
fs.writeFileSync(
  path.join('public-pages', 'why-successful.component.html'),
  `${extractTemplate('app-why-successful')}\n`
);
