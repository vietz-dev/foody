// Turns a shopping-list quantity ("600 g") plus a Picnic pack size ("250 g") into a pack count.
// ponytail: unit table covers weight/volume/pieces only; spoons etc. fall back to 1 pack.

type Base = 'g' | 'ml' | 'piece';
const UNITS: Record<string, [Base, number]> = {
  g: ['g', 1],
  gramm: ['g', 1],
  kg: ['g', 1000],
  ml: ['ml', 1],
  l: ['ml', 1000],
  liter: ['ml', 1000],
  stück: ['piece', 1],
  stueck: ['piece', 1],
  stk: ['piece', 1],
  st: ['piece', 1],
  x: ['piece', 1]
};

const toBase = (amount: number, unit: string): { base: Base; amount: number } | null => {
  const entry = UNITS[unit.trim().toLowerCase().replace(/\.$/, '')];
  return entry ? { base: entry[0], amount: amount * entry[1] } : null;
};

/** Parses Picnic's unit_quantity text, e.g. "250 g", "1 kg", "6 x 300 ml", "ca. 6 Stück". */
export const parsePackSize = (text: string | null | undefined) => {
  if (!text) return null;
  const parts = text
    .toLowerCase()
    .replace(',', '.')
    .match(/(\d+(?:\.\d+)?)\s*(x\s*\d+(?:\.\d+)?\s*)?([a-zäöü]+)?/);
  if (!parts) return null;
  const [, first, multi, unit] = parts;
  const factor = multi ? Number(multi.replace(/[^\d.]/g, '')) : 1;
  const amount = Number(first) * factor;
  if (!unit) return { base: 'piece' as Base, amount };
  return toBase(amount, unit);
};

export const suggestPackCount = (
  quantities: Array<{ amount: number; unit: string }>,
  unitQuantity: string | null | undefined
): number => {
  const pack = parsePackSize(unitQuantity);
  if (!pack || pack.amount <= 0) return 1;
  let needed = 0;
  for (const quantity of quantities) {
    const converted = quantity.unit ? toBase(quantity.amount, quantity.unit) : null;
    if (converted?.base === pack.base) needed += converted.amount;
    else if (!quantity.unit && pack.base === 'piece') needed += quantity.amount;
  }
  return needed > 0 ? Math.max(1, Math.ceil(needed / pack.amount)) : 1;
};
