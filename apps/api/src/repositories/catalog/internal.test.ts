import { describe, expect, it } from 'vitest';
import { mergeIngredientAliases, mergeIngredientData } from './internal.js';

describe('mergeIngredientData', () => {
  it('keeps the target name and carries useful source settings into it', () => {
    expect(
      mergeIngredientData(
        {
          name: 'Tomate',
          aliases: [],
          isStaple: false,
          picnicProductId: null,
          picnicProductName: null,
          picnicUnitQuantity: null
        },
        {
          name: 'Tomaten (für Salat)',
          aliases: ['Salattomaten'],
          isStaple: true,
          picnicProductId: 'picnic-1',
          picnicProductName: 'Tomaten 500 g',
          picnicUnitQuantity: '500 g'
        }
      )
    ).toMatchObject({
      aliases: ['Tomaten (für Salat)', 'Salattomaten'],
      isStaple: true,
      picnicProductId: 'picnic-1',
      picnicProductName: 'Tomaten 500 g'
    });
  });

  it('keeps an existing target Picnic mapping', () => {
    const target = {
      name: 'Tomate',
      aliases: [],
      isStaple: false,
      picnicProductId: 'preferred',
      picnicProductName: 'Bevorzugte Tomaten',
      picnicUnitQuantity: '1 kg'
    };
    const source = {
      name: 'Salattomate',
      aliases: [],
      isStaple: false,
      picnicProductId: 'other',
      picnicProductName: 'Andere Tomaten',
      picnicUnitQuantity: '500 g'
    };
    expect(mergeIngredientData(target, source)).toMatchObject({
      picnicProductId: 'preferred',
      picnicProductName: 'Bevorzugte Tomaten',
      picnicUnitQuantity: '1 kg'
    });
  });
});

describe('mergeIngredientAliases', () => {
  it('retains the old name when an entry is renamed', () => {
    expect(
      mergeIngredientAliases(
        { name: 'Cashewnüsse, ungesalzen', aliases: [] },
        { name: 'Cashewnüsse, ungesalzen (veganer Parmesan)', aliases: [] }
      )
    ).toEqual(['Cashewnüsse, ungesalzen (veganer Parmesan)']);
  });
});
