export async function postConsultationAttachmentMultipart(opts: {
  apiUrl: string;
  token: string;
  consultationId: string;
  file: File;
  caption: string;
  kind?: string;
}): Promise<{ attachment: Record<string, unknown> }> {
  const fd = new FormData();
  fd.append('file', opts.file);
  if (opts.caption.trim()) {
    fd.append('caption', opts.caption.trim());
  }
  if (opts.kind) {
    fd.append('kind', opts.kind);
  }

  const response = await fetch(`${opts.apiUrl}/consultations/${opts.consultationId}/attachments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${opts.token}` },
    body: fd
  });

  if (!response.ok) {
    let message = 'Upload failed.';
    try {
      message = (await response.json() as { message?: string })?.message || message;
    } catch {
      // no-op
    }
    throw new Error(message);
  }

  return (await response.json()) as { attachment: Record<string, unknown> };
}
