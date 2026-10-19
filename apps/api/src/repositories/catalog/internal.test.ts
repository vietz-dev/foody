import { describe, expect, it } from 'vitest';
import type { PrismaClient } from '../../generated/prisma/client.js';
import { mergeIngredientAliases, mergeIngredientData, resolveCatalogGroup } from './internal.js';

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

describe('resolveCatalogGroup', () => {
  it('moves recipe links and preserves aliases, staple status and the target Picnic mapping', async () => {
    const base = {
      householdId: 'home',
      status: 'pending',
      isStaple: false,
      picnicProductId: null,
      picnicProductName: null,
      picnicUnitQuantity: null
    };
    const entries = [
      {
        ...base,
        id: 'oil',
        name: 'Öl',
        aliases: [],
        picnicProductId: 'preferred',
        picnicProductName: 'Speiseöl',
        picnicUnitQuantity: '1 l'
      },
      { ...base, id: 'frying', name: 'Öl (zum Braten)', aliases: [], isStaple: true },
      { ...base, id: 'serving', name: 'Öl (zum Servieren)', aliases: ['Servieröl'] }
    ];
    const moved: string[] = [];
    const deleted: string[] = [];
    let saved: Record<string, unknown> | undefined;
    const transaction = {
      ingredient: {
        findMany: async () => entries,
        delete: async ({ where }: { where: { id: string } }) => {
          deleted.push(where.id);
        },
        update: async ({ data }: { data: Record<string, unknown> }) => {
          saved = data;
        }
      },
      recipeIngredient: {
        updateMany: async ({ where }: { where: { ingredientId: string } }) => {
          moved.push(where.ingredientId);
        }
      }
    };
    const db = {
      $transaction: async (run: (tx: typeof transaction) => Promise<void>) => run(transaction)
    } as unknown as PrismaClient;

    await resolveCatalogGroup(db, 'home', {
      targetId: 'oil',
      sourceIds: ['frying', 'serving'],
      name: 'Öl',
      acceptPicnicConflict: false
    });

    expect(moved).toEqual(['frying', 'serving']);
    expect(deleted).toEqual(['frying', 'serving']);
    expect(saved).toMatchObject({
      status: 'confirmed',
      name: 'Öl',
      aliases: ['Öl (zum Braten)', 'Öl (zum Servieren)', 'Servieröl'],
      isStaple: true,
      picnicProductId: 'preferred'
    });
  });

  it('rejects duplicate or missing entries before changing any links', async () => {
    let changed = false;
    const transaction = {
      ingredient: { findMany: async () => [] },
      recipeIngredient: {
        updateMany: async () => {
          changed = true;
        }
      }
    };
    const db = {
      $transaction: async (run: (tx: typeof transaction) => Promise<void>) => run(transaction)
    } as unknown as PrismaClient;

    await expect(
      resolveCatalogGroup(db, 'home', {
        targetId: 'oil',
        sourceIds: ['oil'],
        name: 'Öl',
        acceptPicnicConflict: false
      })
    ).rejects.toThrow('nur einmal');
    await expect(
      resolveCatalogGroup(db, 'home', {
        targetId: 'oil',
        sourceIds: ['other'],
        name: 'Öl',
        acceptPicnicConflict: false
      })
    ).rejects.toThrow('gehört nicht mehr');
    expect(changed).toBe(false);
  });

  it('requires explicit approval for conflicting Picnic mappings', async () => {
    let changed = false;
    const entries = [
      { id: 'oil', name: 'Öl', aliases: [], isStaple: false, picnicProductId: 'product-a' },
      {
        id: 'frying',
        name: 'Öl (zum Braten)',
        aliases: [],
        isStaple: false,
        picnicProductId: 'product-b'
      }
    ];
    const transaction = {
      ingredient: { findMany: async () => entries },
      recipeIngredient: {
        updateMany: async () => {
          changed = true;
        }
      }
    };
    const db = {
      $transaction: async (run: (tx: typeof transaction) => Promise<void>) => run(transaction)
    } as unknown as PrismaClient;

    await expect(
      resolveCatalogGroup(db, 'home', {
        targetId: 'oil',
        sourceIds: ['frying'],
        name: 'Öl',
        acceptPicnicConflict: false
      })
    ).rejects.toThrow('Unterschiedliche Picnic-Produkte');
    expect(changed).toBe(false);
  });
});
