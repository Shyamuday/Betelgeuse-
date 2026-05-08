/** Build a `https://wa.me/...` link. Pass `e164Digits` without leading + (e.g. `919876543210`). */
export function buildPatientWhatsAppLink(e164Digits: string, message: string): string {
  const digits = e164Digits.replace(/\D/g, '');
  const q = encodeURIComponent(message.trim() || ' ');
  if (!digits) {
    return `https://wa.me/?text=${q}`;
  }
  return `https://wa.me/${digits}?text=${q}`;
}
