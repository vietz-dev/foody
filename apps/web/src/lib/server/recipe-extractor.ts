import { createAnthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { z } from 'zod';

const anthropic = createAnthropic({
	apiKey: process.env.ANTHROPIC_API_KEY ?? '',
	// Override ANTHROPIC_BASE_URL env var set by Claude Code (local proxy)
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
			unit: z
				.string()
				.describe('Einheit (z.B. g, ml, EL, TL, Stück, Prise) — leer lassen wenn keine'),
			name: z.string().describe('Name der Zutat')
		})
	),
	steps: z.array(z.object({ description: z.string().describe('Beschreibung dieses Schritts') }))
});

export type ExtractedRecipe = z.infer<typeof ExtractedRecipeSchema>;

export async function extractRecipeFromImages(images: File[]): Promise<ExtractedRecipe> {
	const result = await generateObject({
		model: anthropic('claude-sonnet-4-6'),
		schema: ExtractedRecipeSchema,
		messages: [
			{
				role: 'user',
				content: [
					...(await Promise.all(
						images.map(async (file) => ({
							type: 'image' as const,
							image: new Uint8Array(await file.arrayBuffer()),
							mediaType: file.type || 'image/jpeg'
						}))
					)),
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
