import { describe, it, expect } from 'vitest';
import {
	buildShoppingList,
	type CatalogIngredientInput,
	type PlanRecipeInput,
	type RecipeIngredientInput
} from './build-shopping-list';

// --- test helpers -----------------------------------------------------------

function ing(
	name: string,
	quantity: number | null,
	unit: string | null,
	ingredientId: string | null
): RecipeIngredientInput {
	return { name, quantity, unit, ingredientId };
}

function recipe(
	recipeId: string,
	recipeName: string,
	portions: number,
	ingredients: RecipeIngredientInput[]
): PlanRecipeInput {
	return { recipeId, recipeName, portions, ingredients };
}

const catalog: CatalogIngredientInput[] = [
	{ id: 'flour', name: 'Mehl', isStaple: false },
	{ id: 'salt', name: 'Salz', isStaple: true },
	{ id: 'milk', name: 'Milch', isStaple: false },
	{ id: 'eggs', name: 'Eier', isStaple: false },
	{ id: 'oil', name: 'Öl', isStaple: true }
];

// --- tests -------------------------------------------------------------------

describe('buildShoppingList — scaling', () => {
	it('scales quantity by portions (per-portion * portions)', () => {
		const list = buildShoppingList(
			[recipe('r1', 'Kuchen', 4, [ing('Mehl', 100, 'g', 'flour')])],
			catalog
		);
		expect(list.einkaufen).toHaveLength(1);
		expect(list.einkaufen[0]).toMatchObject({
			ingredientId: 'flour',
			name: 'Mehl',
			recipeCount: 1,
			unquantified: false
		});
		expect(list.einkaufen[0].quantities).toEqual([{ amount: 400, unit: 'g' }]);
	});

	it('defaults nothing — uses the provided portions verbatim', () => {
		const list = buildShoppingList(
			[recipe('r1', 'Kuchen', 2, [ing('Mehl', 250, 'g', 'flour')])],
			catalog
		);
		expect(list.einkaufen[0].quantities).toEqual([{ amount: 500, unit: 'g' }]);
	});
});

describe('buildShoppingList — aggregation across recipes', () => {
	it('sums the same ingredient across two recipes into ONE line item', () => {
		const list = buildShoppingList(
			[
				recipe('r1', 'A', 2, [ing('Mehl', 100, 'g', 'flour')]),
				recipe('r2', 'B', 3, [ing('Mehl', 50, 'g', 'flour')])
			],
			catalog
		);
		expect(list.einkaufen).toHaveLength(1);
		// 100*2 + 50*3 = 200 + 150 = 350
		expect(list.einkaufen[0].quantities).toEqual([{ amount: 350, unit: 'g' }]);
		expect(list.einkaufen[0].recipeCount).toBe(2);
	});

	it('recipeCount counts DISTINCT recipes, not ingredient rows', () => {
		const list = buildShoppingList(
			[
				recipe('r1', 'A', 1, [
					ing('Mehl', 100, 'g', 'flour'),
					ing('Mehl', 50, 'g', 'flour') // same recipe, second row
				])
			],
			catalog
		);
		expect(list.einkaufen[0].recipeCount).toBe(1);
		expect(list.einkaufen[0].quantities).toEqual([{ amount: 150, unit: 'g' }]);
	});
});

describe('buildShoppingList — mass family (g + kg)', () => {
	it('merges g and kg into one summand, promoting to kg at >= 1000 g', () => {
		const list = buildShoppingList(
			[
				recipe('r1', 'A', 1, [ing('Mehl', 800, 'g', 'flour')]),
				recipe('r2', 'B', 1, [ing('Mehl', 0.5, 'kg', 'flour')])
			],
			catalog
		);
		// 800 g + 500 g = 1300 g -> 1.3 kg
		expect(list.einkaufen[0].quantities).toEqual([{ amount: 1.3, unit: 'kg' }]);
	});

	it('keeps grams while below 1000 g', () => {
		const list = buildShoppingList(
			[recipe('r1', 'A', 1, [ing('Mehl', 300, 'g', 'flour')])],
			catalog
		);
		expect(list.einkaufen[0].quantities).toEqual([{ amount: 300, unit: 'g' }]);
	});

	it('is case-insensitive on known units (KG === kg)', () => {
		const list = buildShoppingList(
			[recipe('r1', 'A', 1, [ing('Mehl', 2, 'KG', 'flour')])],
			catalog
		);
		expect(list.einkaufen[0].quantities).toEqual([{ amount: 2, unit: 'kg' }]);
	});
});

describe('buildShoppingList — volume family (ml + l)', () => {
	it('merges ml and l into one summand, promoting to l at >= 1000 ml', () => {
		const list = buildShoppingList(
			[
				recipe('r1', 'A', 1, [ing('Milch', 750, 'ml', 'milk')]),
				recipe('r2', 'B', 1, [ing('Milch', 0.5, 'l', 'milk')])
			],
			catalog
		);
		// 750 ml + 500 ml = 1250 ml -> 1.25 l
		expect(list.einkaufen[0].quantities).toEqual([{ amount: 1.25, unit: 'l' }]);
	});

	it('keeps millilitres while below 1000 ml', () => {
		const list = buildShoppingList(
			[recipe('r1', 'A', 1, [ing('Milch', 200, 'ml', 'milk')])],
			catalog
		);
		expect(list.einkaufen[0].quantities).toEqual([{ amount: 200, unit: 'ml' }]);
	});
});

describe('buildShoppingList — incompatible units on one item', () => {
	it('emits two summands (mass + unknown) on a single line item', () => {
		const list = buildShoppingList(
			[
				recipe('r1', 'A', 1, [ing('Eier', 300, 'g', 'eggs')]),
				recipe('r2', 'B', 1, [ing('Eier', 2, 'Stück', 'eggs')])
			],
			catalog
		);
		expect(list.einkaufen).toHaveLength(1);
		expect(list.einkaufen[0].quantities).toEqual([
			{ amount: 300, unit: 'g' },
			{ amount: 2, unit: 'Stück' }
		]);
		expect(list.einkaufen[0].recipeCount).toBe(2);
	});

	it('sums identical unknown units, keeps distinct unknown units separate', () => {
		const list = buildShoppingList(
			[
				recipe('r1', 'A', 1, [
					ing('Eier', 2, 'Stück', 'eggs'),
					ing('Eier', 1, 'EL', 'eggs')
				]),
				recipe('r2', 'B', 2, [ing('Eier', 3, 'Stück', 'eggs')])
			],
			catalog
		);
		// Stück: 2*1 + 3*2 = 8 ; EL: 1*1 = 1. Sorted by lowercased unit key: 'el' < 'stück'.
		expect(list.einkaufen[0].quantities).toEqual([
			{ amount: 1, unit: 'EL' },
			{ amount: 8, unit: 'Stück' }
		]);
	});

	it('treats empty/null unit as its own unknown summand', () => {
		const list = buildShoppingList(
			[
				recipe('r1', 'A', 1, [ing('Eier', 3, '', 'eggs')]),
				recipe('r2', 'B', 1, [ing('Eier', 2, null, 'eggs')])
			],
			catalog
		);
		expect(list.einkaufen[0].quantities).toEqual([{ amount: 5, unit: '' }]);
	});
});

describe('buildShoppingList — sectioning', () => {
	it('routes staple ingredients to vorrat with correct recipeCount', () => {
		const list = buildShoppingList(
			[
				recipe('r1', 'A', 2, [ing('Salz', 5, 'g', 'salt')]),
				recipe('r2', 'B', 3, [ing('Salz', 2, 'g', 'salt')])
			],
			catalog
		);
		expect(list.einkaufen).toHaveLength(0);
		expect(list.vorrat).toHaveLength(1);
		expect(list.vorrat[0]).toMatchObject({
			ingredientId: 'salt',
			name: 'Salz',
			recipeCount: 2 // "für 2 Rezepte"
		});
		// 5*2 + 2*3 = 16 g
		expect(list.vorrat[0].quantities).toEqual([{ amount: 16, unit: 'g' }]);
	});

	it('routes unmapped ingredients to nichtZugeordnet', () => {
		const list = buildShoppingList(
			[recipe('r1', 'A', 2, [ing('Frische Petersilie', 1, 'Bund', null)])],
			catalog
		);
		expect(list.nichtZugeordnet).toHaveLength(1);
		expect(list.nichtZugeordnet[0]).toMatchObject({
			ingredientId: null,
			name: 'Frische Petersilie'
		});
		expect(list.nichtZugeordnet[0].quantities).toEqual([{ amount: 2, unit: 'Bund' }]);
	});

	it('aggregates unmapped ingredients by normalized name', () => {
		const list = buildShoppingList(
			[
				recipe('r1', 'A', 1, [ing('  Frische   Petersilie ', 1, 'Bund', null)]),
				recipe('r2', 'B', 1, [ing('frische petersilie', 2, 'Bund', null)])
			],
			catalog
		);
		expect(list.nichtZugeordnet).toHaveLength(1);
		// first-seen raw name is preserved as display
		expect(list.nichtZugeordnet[0].name).toBe('Frische   Petersilie');
		expect(list.nichtZugeordnet[0].quantities).toEqual([{ amount: 3, unit: 'Bund' }]);
		expect(list.nichtZugeordnet[0].recipeCount).toBe(2);
	});

	it('falls back to einkaufen when a mapped id is missing from the catalog', () => {
		const list = buildShoppingList(
			[recipe('r1', 'A', 1, [ing('Zucker', 100, 'g', 'ghost-id')])],
			catalog
		);
		expect(list.einkaufen).toHaveLength(1);
		expect(list.einkaufen[0]).toMatchObject({
			ingredientId: 'ghost-id',
			name: 'Zucker' // falls back to raw name
		});
		expect(list.vorrat).toHaveLength(0);
		expect(list.nichtZugeordnet).toHaveLength(0);
	});
});

describe('buildShoppingList — null quantity handling', () => {
	it('null quantity appears as a line item, contributes no amount, flags unquantified', () => {
		const list = buildShoppingList(
			[recipe('r1', 'A', 2, [ing('Salz', null, null, 'salt')])],
			catalog
		);
		expect(list.vorrat).toHaveLength(1);
		expect(list.vorrat[0].quantities).toEqual([]);
		expect(list.vorrat[0].unquantified).toBe(true);
		expect(list.vorrat[0].recipeCount).toBe(1);
	});

	it('mixes a null contribution with a concrete one on the same item', () => {
		const list = buildShoppingList(
			[
				recipe('r1', 'A', 2, [ing('Mehl', 100, 'g', 'flour')]),
				recipe('r2', 'B', 1, [ing('Mehl', null, null, 'flour')])
			],
			catalog
		);
		expect(list.einkaufen[0].quantities).toEqual([{ amount: 200, unit: 'g' }]);
		expect(list.einkaufen[0].unquantified).toBe(true);
		expect(list.einkaufen[0].recipeCount).toBe(2);
	});
});

describe('buildShoppingList — edge cases & ordering', () => {
	it('empty input yields three empty sections', () => {
		const list = buildShoppingList([], catalog);
		expect(list).toEqual({ einkaufen: [], vorrat: [], nichtZugeordnet: [] });
	});

	it('orders each section by name (case-insensitive)', () => {
		const bigCatalog: CatalogIngredientInput[] = [
			{ id: 'a', name: 'Zwiebel', isStaple: false },
			{ id: 'b', name: 'Apfel', isStaple: false },
			{ id: 'c', name: 'mandel', isStaple: false }
		];
		const list = buildShoppingList(
			[
				recipe('r1', 'A', 1, [
					ing('Zwiebel', 1, 'Stück', 'a'),
					ing('Apfel', 1, 'Stück', 'b'),
					ing('Mandel', 1, 'g', 'c')
				])
			],
			bigCatalog
		);
		expect(list.einkaufen.map((i) => i.name)).toEqual(['Apfel', 'mandel', 'Zwiebel']);
	});

	it('mass summand always precedes volume summand precedes unknown summands', () => {
		const list = buildShoppingList(
			[
				recipe('r1', 'A', 1, [
					ing('Zutat', 5, 'Stück', 'x'),
					ing('Zutat', 100, 'ml', 'x'),
					ing('Zutat', 50, 'g', 'x')
				])
			],
			[{ id: 'x', name: 'Zutat', isStaple: false }]
		);
		expect(list.einkaufen[0].quantities).toEqual([
			{ amount: 50, unit: 'g' },
			{ amount: 100, unit: 'ml' },
			{ amount: 5, unit: 'Stück' }
		]);
	});

	it('tames floating-point noise (rounds to 3 decimals)', () => {
		const list = buildShoppingList(
			[
				recipe('r1', 'A', 1, [ing('Mehl', 0.1, 'g', 'flour')]),
				recipe('r2', 'B', 1, [ing('Mehl', 0.2, 'g', 'flour')])
			],
			catalog
		);
		expect(list.einkaufen[0].quantities).toEqual([{ amount: 0.3, unit: 'g' }]);
	});
});
