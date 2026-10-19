import { describe, expect, it } from 'vitest';
import type { PrismaClient } from '../../generated/prisma/client.js';
import {
  detachCatalogExpression,
  mergeIngredientAliases,
  mergeIngredientData,
  resolveCatalogGroup
} from './internal.js';

const transactionDb = <T>(transaction: T) =>
  ({
    $transaction: async (run: (tx: T) => Promise<unknown>) => run(transaction)
  }) as unknown as PrismaClient;

const guardedMergeDb = (entries: unknown[]) => {
  let changed = false;
  const db = transactionDb({
    ingredient: { findMany: async () => entries },
    recipeIngredient: {
      updateMany: async () => {
        changed = true;
      }
    }
  });
  return { db, wasChanged: () => changed };
};

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
    const expressions = [
      { id: 'expr-oil', ingredientId: 'oil', name: 'Öl' },
      { id: 'expr-frying', ingredientId: 'frying', name: 'Öl (zum Braten)' },
      { id: 'expr-serving', ingredientId: 'serving', name: 'Öl (zum Servieren)' },
      { id: 'expr-alias', ingredientId: 'serving', name: 'Servieröl' }
    ];
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
        updateMany: async ({ where }: { where: { ingredientId?: string } }) => {
          if (where.ingredientId) moved.push(where.ingredientId);
        }
      },
      ingredientExpression: {
        findMany: async ({ where }: { where: { ingredientId: string } }) =>
          expressions.filter((expression) => expression.ingredientId === where.ingredientId),
        findUnique: async ({
          where
        }: {
          where: { ingredientId_name: { ingredientId: string; name: string } };
        }) =>
          expressions.find(
            (expression) =>
              expression.ingredientId === where.ingredientId_name.ingredientId &&
              expression.name === where.ingredientId_name.name
          ) ?? null,
        update: async ({
          where,
          data
        }: {
          where: { id: string };
          data: { ingredientId: string };
        }) => {
          expressions.find((expression) => expression.id === where.id)!.ingredientId =
            data.ingredientId;
        },
        delete: async ({ where }: { where: { id: string } }) => {
          expressions.splice(
            expressions.findIndex((expression) => expression.id === where.id),
            1
          );
        },
        upsert: async ({
          where,
          create
        }: {
          where: { ingredientId_name: { ingredientId: string; name: string } };
          create: { ingredientId: string; name: string };
        }) => {
          const existing = expressions.find(
            (expression) =>
              expression.ingredientId === where.ingredientId_name.ingredientId &&
              expression.name === where.ingredientId_name.name
          );
          if (existing) return existing;
          const expression = { id: 'new-expression', ...create };
          expressions.push(expression);
          return expression;
        }
      }
    };
    const db = transactionDb(transaction);

    await resolveCatalogGroup(db, 'home', {
      targetId: 'oil',
      sourceIds: ['frying', 'serving'],
      name: 'Öl',
      acceptPicnicConflict: false
    });

    expect(moved).toEqual(['frying', 'serving']);
    expect(deleted).toEqual(['frying', 'serving']);
    expect(expressions.map((expression) => expression.ingredientId)).toEqual([
      'oil',
      'oil',
      'oil',
      'oil'
    ]);
    expect(saved).toMatchObject({
      status: 'confirmed',
      name: 'Öl',
      aliases: ['Öl (zum Braten)', 'Öl (zum Servieren)', 'Servieröl'],
      isStaple: true,
      picnicProductId: 'preferred'
    });
  });

  it('detaches one expression and relinks only its recipes', async () => {
    const expressions = [
      { id: 'base', ingredientId: 'oil', name: 'Öl', createdAt: new Date(0) },
      { id: 'frying', ingredientId: 'oil', name: 'Öl (zum Braten)', createdAt: new Date(1) }
    ];
    const recipes = [
      { id: 'one', ingredientId: 'oil', expressionId: 'base' },
      { id: 'two', ingredientId: 'oil', expressionId: 'frying' }
    ];
    let remainingGroup: Record<string, unknown> | undefined;
    const transaction = {
      ingredient: {
        create: async () => ({ id: 'new-group' }),
        update: async ({ data }: { data: Record<string, unknown> }) => {
          remainingGroup = data;
        }
      },
      ingredientExpression: {
        findFirst: async () => ({
          ...expressions[0],
          ingredient: { id: 'oil', name: 'Öl' }
        }),
        findMany: async ({ where }: { where: { ingredientId: string; id?: { not: string } } }) =>
          expressions.filter(
            (expression) =>
              expression.ingredientId === where.ingredientId && expression.id !== where.id?.not
          ),
        update: async ({
          where,
          data
        }: {
          where: { id: string };
          data: { ingredientId: string };
        }) => {
          expressions.find((expression) => expression.id === where.id)!.ingredientId =
            data.ingredientId;
        }
      },
      recipeIngredient: {
        updateMany: async ({
          where,
          data
        }: {
          where: { expressionId: string };
          data: { ingredientId: string };
        }) => {
          recipes
            .filter((recipe) => recipe.expressionId === where.expressionId)
            .forEach((recipe) => {
              recipe.ingredientId = data.ingredientId;
            });
        }
      }
    };
    const db = transactionDb(transaction);

    await detachCatalogExpression(db, 'home', 'base');

    expect(recipes.map((recipe) => recipe.ingredientId)).toEqual(['new-group', 'oil']);
    expect(expressions.map((expression) => expression.ingredientId)).toEqual(['new-group', 'oil']);
    expect(remainingGroup).toMatchObject({ name: 'Öl (zum Braten)', aliases: [] });
  });

  it('rejects duplicate or missing entries before changing any links', async () => {
    const { db, wasChanged } = guardedMergeDb([]);

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
    expect(wasChanged()).toBe(false);
  });

  it('requires explicit approval for conflicting Picnic mappings', async () => {
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
    const { db, wasChanged } = guardedMergeDb(entries);

    await expect(
      resolveCatalogGroup(db, 'home', {
        targetId: 'oil',
        sourceIds: ['frying'],
        name: 'Öl',
        acceptPicnicConflict: false
      })
    ).rejects.toThrow('Unterschiedliche Picnic-Produkte');
    expect(wasChanged()).toBe(false);
  });
});
