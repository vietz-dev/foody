import { describe, expect, it } from 'vitest';
import type { PrismaClient } from '../../generated/prisma/client.js';
import { loadShoppingList } from './repository.js';

describe('loadShoppingList', () => {
  it('links legacy recipe ingredients before building the list', async () => {
    const rows = [
      {
        id: 'row-1',
        name: 'Tomaten',
        ingredientId: null as string | null,
        quantity: 2,
        unit: 'Stück'
      },
      {
        id: 'row-2',
        name: ' tomaten ',
        ingredientId: null as string | null,
        quantity: 1,
        unit: 'Stück'
      },
      {
        id: 'row-3',
        name: 'Agavendicksaft',
        ingredientId: null as string | null,
        quantity: 1,
        unit: 'EL'
      }
    ];
    const catalog: Array<{
      id: string;
      name: string;
      aliases: string[];
      status: string;
      isStaple: boolean;
      picnicProductId: string | null;
      picnicProductName: string | null;
      picnicUnitQuantity: string | null;
    }> = [
      {
        id: 'tomato',
        name: 'Tomate',
        aliases: ['Tomaten'],
        status: 'confirmed',
        isStaple: false,
        picnicProductId: 'picnic-tomato',
        picnicProductName: 'Tomaten',
        picnicUnitQuantity: '500 g'
      }
    ];
    const db = {
      weeklyPlanItem: {
        findMany: async () => [
          {
            recipeId: 'recipe-1',
            portions: 1,
            recipe: { ingredients: rows.map((row) => ({ ...row })) }
          }
        ]
      },
      recipeIngredient: {
        findMany: async () =>
          rows.filter((row) => !row.ingredientId).map(({ id, name }) => ({ id, name })),
        update: async ({
          where,
          data
        }: {
          where: { id: string };
          data: { ingredientId: string };
        }) => {
          rows.find((row) => row.id === where.id)!.ingredientId = data.ingredientId;
        }
      },
      ingredient: {
        findMany: async () => catalog.map((entry) => ({ ...entry })),
        update: async ({ where, data }: { where: { id: string }; data: { aliases: string[] } }) => {
          catalog.find((entry) => entry.id === where.id)!.aliases = data.aliases;
        },
        create: async ({ data }: { data: { name: string } }) => {
          const entry = {
            id: 'new-ingredient',
            name: data.name,
            aliases: [],
            status: 'pending',
            isStaple: false,
            picnicProductId: null,
            picnicProductName: null,
            picnicUnitQuantity: null
          };
          catalog.push(entry);
          return entry;
        }
      },
      ingredientExpression: {
        upsert: async ({ create }: { create: { ingredientId: string; name: string } }) => ({
          id: `${create.ingredientId}:${create.name}`,
          ...create
        })
      }
    } as unknown as PrismaClient;

    const list = await loadShoppingList(db, 'household-1');

    expect(list.nichtZugeordnet).toEqual([]);
    expect(list.einkaufen).toMatchObject([
      { ingredientId: 'new-ingredient', name: 'Agavendicksaft' },
      {
        ingredientId: 'tomato',
        name: 'Tomate',
        quantities: [{ amount: 3, unit: 'Stück' }],
        picnic: { id: 'picnic-tomato' }
      }
    ]);
  });
});
