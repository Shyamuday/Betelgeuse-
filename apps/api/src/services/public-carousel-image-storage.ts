import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads', 'public-carousel');
const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

function extensionForMime(mimeType: string) {
  if (mimeType === 'image/jpeg') return '.jpg';
  if (mimeType === 'image/png') return '.png';
  if (mimeType === 'image/webp') return '.webp';
  return '';
}

function assertSafeKey(storageKey: string) {
  const normalized = path.normalize(storageKey).replace(/^(\.\.(\/|\\|$))+/, '');
  const absolutePath = path.join(UPLOAD_ROOT, normalized);
  if (!absolutePath.startsWith(UPLOAD_ROOT)) {
    throw new Error('INVALID_STORAGE_KEY');
  }
  return { normalized, absolutePath };
}

export async function savePublicCarouselImage(input: {
  mimeType: string;
  fileName?: string | null;
  dataBase64: string;
}) {
  if (!ALLOWED_MIME.has(input.mimeType)) throw new Error('UNSUPPORTED_MIME');
  const buffer = Buffer.from(input.dataBase64, 'base64');
  if (!buffer.length) throw new Error('EMPTY_FILE');
  if (buffer.length > MAX_BYTES) throw new Error('FILE_TOO_LARGE');

  await mkdir(UPLOAD_ROOT, { recursive: true });
  const ext = extensionForMime(input.mimeType) || path.extname(input.fileName || '') || '.bin';
  const storageKey = `${randomUUID()}${ext}`;
  const { absolutePath } = assertSafeKey(storageKey);
  await writeFile(absolutePath, buffer);
  return {
    storageKey,
    byteSize: buffer.length,
    sha256: createHash('sha256').update(buffer).digest('hex'),
    mimeType: input.mimeType
  };
}

export async function readPublicCarouselImage(storageKey: string) {
  const { absolutePath } = assertSafeKey(storageKey);
  return readFile(absolutePath);
}

export async function deletePublicCarouselImage(storageKey: string | null | undefined) {
  if (!storageKey) return;
  const { absolutePath } = assertSafeKey(storageKey);
  await unlink(absolutePath).catch(() => undefined);
}

export function publicCarouselImageMimeType(storageKey: string) {
  const ext = path.extname(storageKey).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'application/octet-stream';
}
