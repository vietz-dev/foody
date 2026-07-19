import { createAnthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { z } from 'zod';
import { env } from '$env/dynamic/private';

const anthropic = createAnthropic({
	apiKey: env.ANTHROPIC_API_KEY ?? '',
	// Override ANTHROPIC_BASE_URL env var set by Claude Code (local proxy at 127.0.0.1:8787)
	baseURL: 'https://api.anthropic.com'
});

export const ExtractedRecipeSchema = z.object({
	name: z.string().describe('Name des Rezepts'),
	servings: z.number().int().min(1).describe('Anzahl der Portionen wie im Rezept angegeben'),
	prepTimeMinutes: z.number().int().optional().describe('Zubereitungszeit in Minuten (optional)'),
	notes: z.string().optional().describe('Allgemeine Notizen oder Hinweise zum Rezept (optional)'),
	ingredients: z.array(
		z.object({
			quantity: z.number().describe('Menge (z.B. 2, 0.5, 200)'),
			unit: z.string().describe('Einheit (z.B. g, ml, EL, TL, Stück, Prise) — leer lassen wenn keine'),
			name: z.string().describe('Name der Zutat')
		})
	),
	steps: z.array(
		z.object({
			description: z.string().describe('Beschreibung dieses Schritts')
		})
	)
});

export type ExtractedRecipe = z.infer<typeof ExtractedRecipeSchema>;

export async function extractRecipeFromImages(imageDataUrls: string[]): Promise<ExtractedRecipe> {
	const result = await generateObject({
		model: anthropic('claude-sonnet-4-6'),
		schema: ExtractedRecipeSchema,
		messages: [
			{
				role: 'user',
				content: [
					...imageDataUrls.map((dataUrl) => {
						const [header, data] = dataUrl.split(',');
						const rawType = (header?.match(/data:([^;]+)/) ?? [])[1] ?? '';
						const SUPPORTED = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
						const mediaType = SUPPORTED.has(rawType) ? rawType : 'image/jpeg';
						return {
							type: 'file' as const,
							data: data ?? '',
							mediaType
						};
					}),
					{
						type: 'text' as const,
						text: `Extrahiere das Rezept aus diesen Buchseiten.
Gib alle Zutaten mit Menge, Einheit und Name an.
Gib alle Zubereitungsschritte in der richtigen Reihenfolge an.
Wenn keine Einheit für eine Zutat angegeben ist, lass das Feld leer.
Antworte immer auf Deutsch.`
					}
				]
			}
		]
	});

	return result.object;
}
