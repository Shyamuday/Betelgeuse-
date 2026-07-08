import pdfParse from 'pdf-parse';
import { buildExtractionFromText } from './clinical-media-text-parser.js';

export type PdfExtractionResult = {
  rawText: string;
  phrases: string[];
  impression: string;
  findings: string[];
  model: string;
  pageCount: number;
};

const MIN_TEXT_LENGTH = 40;

export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<PdfExtractionResult> {
  const parsed = await pdfParse(buffer);
  const rawText = (parsed.text || '').replace(/\r/g, '\n').trim();

  if (rawText.length < MIN_TEXT_LENGTH) {
    throw new Error('PDF_NO_TEXT');
  }

  const extraction = buildExtractionFromText(rawText, 'local-pdf-text');
  return {
    ...extraction,
    pageCount: parsed.numpages ?? 1
  };
}

export function pdfExtractionConfig() {
  return {
    provider: 'local-pdf-text',
    model: 'pdf-parse'
  };
}
