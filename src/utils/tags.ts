export const PRESET_TRANSACTION_TAGS: string[] = [
  '#Work',
  '#Personal',
  '#Housing',
  '#Groceries',
  '#Travel',
  '#Utilities',
  '#Savings',
  '#TaxDeductible',
];

export const normalizeTag = (raw: string): string | null => {
  const cleaned = raw
    .trim()
    .replace(/^#+/, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '')
    .slice(0, 24);
  if (!cleaned) return null;
  const formatted = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return `#${formatted}`;
};

export const normalizeTransactionTags = (tags?: string[]): string[] => {
  if (!Array.isArray(tags) || tags.length === 0) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of tags) {
    const normalized = normalizeTag(raw);
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(normalized);
    }
  }
  return result;
};
