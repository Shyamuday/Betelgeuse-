export type CghsFormularyEntry = {
  code: string;
  name: string;
  potency: string;
  amount: string;
  label: string;
};

export function formularyOptionValue(e: CghsFormularyEntry): string {
  return `${e.code}\t${e.name}\t${e.potency}\t${e.amount}`;
}

export function parseFormularyPick(key: string): { name: string; potency: string; amount: string } | null {
  if (!key || key === '__other__') {
    return null;
  }
  const parts = key.split('\t');
  if (parts.length < 4) {
    return null;
  }
  const [, name, potency, amount] = parts;
  return { name, potency, amount };
}

export function filterFormularyOptions(formulary: CghsFormularyEntry[], query: string): CghsFormularyEntry[] {
  if (!formulary.length) {
    return [];
  }
  const q = query.trim().toLowerCase();
  if (!q) {
    return formulary.slice(0, 160);
  }
  return formulary
    .filter(
      (e) =>
        e.label.toLowerCase().includes(q) ||
        e.code.toLowerCase().includes(q) ||
        e.name.toLowerCase().includes(q)
    )
    .slice(0, 400);
}

function tryMatchFormulary(
  formulary: CghsFormularyEntry[],
  name: string,
  strength: string,
  dose: string
): CghsFormularyEntry | null {
  const n = name.trim().toLowerCase();
  if (!n) {
    return null;
  }
  const s = (strength || '').trim().toLowerCase();
  const d = (dose || '').trim().toLowerCase();
  return (
    formulary.find((e) => {
      if (e.name.trim().toLowerCase() !== n) {
        return false;
      }
      if (s && (e.potency || '').trim().toLowerCase() !== s) {
        return false;
      }
      if (d && (e.amount || '').trim().toLowerCase() !== d) {
        return false;
      }
      return true;
    }) || null
  );
}

export function matchFormularyKey(formulary: CghsFormularyEntry[], name: string, strength: string, dose: string): string {
  if (!formulary.length || !name.trim()) {
    return '';
  }
  const byAll = tryMatchFormulary(formulary, name, strength, dose);
  if (byAll) {
    return formularyOptionValue(byAll);
  }
  const byNamePotency = tryMatchFormulary(formulary, name, strength, '');
  if (byNamePotency) {
    return formularyOptionValue(byNamePotency);
  }
  return '__other__';
}
