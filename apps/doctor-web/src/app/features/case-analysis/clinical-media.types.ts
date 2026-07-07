import type { ClinicalMediaType } from '@vitalis/homeopathy-approaches';

export type ClinicalMediaItem = {
  id: string;
  caseAnalysisId: string;
  mediaType: ClinicalMediaType;
  mediaTypeLabel: string;
  bodyRegion: string | null;
  mimeType: string;
  fileName: string | null;
  observations: string | null;
  patientConsent: boolean;
  fileUrl: string;
  createdAt: string;
  updatedAt: string;
};
