import { describe, expect, it } from 'vitest';
import { parsePackSize, suggestPackCount } from './quantity.js';

describe('parsePackSize', () => {
  it('reads weight, volume, multipacks and pieces', () => {
    expect(parsePackSize('250 g')).toEqual({ base: 'g', amount: 250 });
    expect(parsePackSize('1 kg')).toEqual({ base: 'g', amount: 1000 });
    expect(parsePackSize('6 x 300 ml')).toEqual({ base: 'ml', amount: 1800 });
    expect(parsePackSize('ca. 6 Stück')).toEqual({ base: 'piece', amount: 6 });
    expect(parsePackSize('Bund')).toBeNull();
  });
});

describe('suggestPackCount', () => {
  it('rounds up to whole packs across compatible units', () => {
    expect(suggestPackCount([{ amount: 600, unit: 'g' }], '250 g')).toBe(3);
    expect(
      suggestPackCount(
        [
          { amount: 0.5, unit: 'kg' },
          { amount: 200, unit: 'g' }
        ],
        '250 g'
      )
    ).toBe(3);
    expect(suggestPackCount([{ amount: 3, unit: '' }], '6 Stück')).toBe(1);
    expect(suggestPackCount([{ amount: 8, unit: 'Stück' }], '6 Stück')).toBe(2);
  });
  it('falls back to one pack when units do not match', () => {
    expect(suggestPackCount([{ amount: 2, unit: 'EL' }], '500 ml')).toBe(1);
    expect(suggestPackCount([], '500 ml')).toBe(1);
    expect(suggestPackCount([{ amount: 1, unit: 'Stück' }], null)).toBe(1);
  });
});
