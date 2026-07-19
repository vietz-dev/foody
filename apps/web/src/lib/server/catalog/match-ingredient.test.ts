import { describe, expect, it } from 'vitest';
import {
	matchIngredient,
	normalizeIngredientName,
	type CatalogEntry
} from './match-ingredient';

describe('normalizeIngredientName', () => {
	it('lowercases', () => {
		expect(normalizeIngredientName('Mehl')).toBe('mehl');
		expect(normalizeIngredientName('Mehl')).toBe(normalizeIngredientName('mehl'));
	});

	it('trims leading/trailing whitespace', () => {
		expect(normalizeIngredientName('  Mehl  ')).toBe('mehl');
	});

	it('collapses internal whitespace runs to a single space', () => {
		expect(normalizeIngredientName('Brauner  Zucker')).toBe('brauner zucker');
		expect(normalizeIngredientName('Brauner\t\tZucker')).toBe('brauner zucker');
		expect(normalizeIngredientName('Brauner   \n  Zucker')).toBe('brauner zucker');
	});

	it('preserves umlauts and does not fold them away', () => {
		expect(normalizeIngredientName('Öl')).toBe('öl');
		expect(normalizeIngredientName('Ol')).toBe('ol');
		expect(normalizeIngredientName('Öl')).not.toBe(normalizeIngredientName('Ol'));
	});

	it('preserves ß', () => {
		expect(normalizeIngredientName('Straße')).toBe('straße');
	});

	it('handles empty string', () => {
		expect(normalizeIngredientName('')).toBe('');
	});
});

describe('matchIngredient', () => {
	const catalog: CatalogEntry[] = [
		{ id: '1', name: 'Mehl', aliases: ['Weizenmehl', 'Type 405'], status: 'confirmed' },
		{ id: '2', name: 'Zucker', aliases: ['Brauner Zucker'], status: 'confirmed' },
		{ id: '3', name: 'Öl', aliases: [], status: 'pending' }
	];

	it('matches exact canonical name (case/whitespace-insensitive)', () => {
		expect(matchIngredient('mehl', catalog)).toEqual({
			matched: true,
			ingredientId: '1',
			via: 'name'
		});
		expect(matchIngredient('  MEHL  ', catalog)).toEqual({
			matched: true,
			ingredientId: '1',
			via: 'name'
		});
	});

	it('matches via alias and reports via: alias', () => {
		expect(matchIngredient('Weizenmehl', catalog)).toEqual({
			matched: true,
			ingredientId: '1',
			via: 'alias'
		});
		expect(matchIngredient('brauner   zucker', catalog)).toEqual({
			matched: true,
			ingredientId: '2',
			via: 'alias'
		});
	});

	it('matches exact canonical name and reports via: name', () => {
		expect(matchIngredient('Zucker', catalog)).toEqual({
			matched: true,
			ingredientId: '2',
			via: 'name'
		});
	});

	it('returns no match when nothing corresponds', () => {
		expect(matchIngredient('Butter', catalog)).toEqual({ matched: false });
	});

	it('umlauts remain distinctive: "Öl" does not match a catalog entry "Ol"', () => {
		const olCatalog: CatalogEntry[] = [{ id: '9', name: 'Ol', aliases: [], status: 'confirmed' }];
		expect(matchIngredient('Öl', olCatalog)).toEqual({ matched: false });
		// but it does match a correctly-spelled "Öl" entry
		expect(matchIngredient('öl', catalog)).toEqual({
			matched: true,
			ingredientId: '3',
			via: 'name'
		});
	});

	it('returns no match for empty catalog', () => {
		expect(matchIngredient('Mehl', [])).toEqual({ matched: false });
	});

	it('returns no match for empty string input against a non-empty catalog', () => {
		expect(matchIngredient('', catalog)).toEqual({ matched: false });
	});

	it('prefers a name match over an alias match across different entries', () => {
		// "Zucker" is entry 2's canonical name, but suppose another entry has it as an alias.
		const tieBreakCatalog: CatalogEntry[] = [
			{ id: 'a', name: 'Puderzucker', aliases: ['Zucker'], status: 'confirmed' },
			{ id: 'b', name: 'Zucker', aliases: [], status: 'confirmed' }
		];
		expect(matchIngredient('Zucker', tieBreakCatalog)).toEqual({
			matched: true,
			ingredientId: 'b',
			via: 'name'
		});
	});
});
