'use client';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Button, Field, IconButton, Input, Textarea } from '@chakra-ui/react';
import type { RecipeInput } from '@foody/contracts';
import { AppShell, PageHeader } from '../../../components/app-shell';
import { PlusIcon } from '../../../components/icons';
import type { ExtractedRecipe } from '../../../lib/server/recipe-extractor';
import { createRecipe } from '../actions';
import { BackToRecipesLink } from '../back-to-recipes-link';
import { ScanUpload } from './scan-upload';

type IngredientRow = { quantity: string; unit: string; name: string };
const emptyIngredient = (): IngredientRow => ({ quantity: '', unit: '', name: '' });

export default function NewRecipePage() {
	const [pending, startTransition] = useTransition();
	const [error, setError] = useState('');
	const [name, setName] = useState('');
	const [servings, setServings] = useState('2');
	const [prepTime, setPrepTime] = useState('');
	const [bookTitle, setBookTitle] = useState('');
	const [bookPage, setBookPage] = useState('');
	const [notes, setNotes] = useState('');
	const [ingredients, setIngredients] = useState<IngredientRow[]>([emptyIngredient()]);
	const [steps, setSteps] = useState<string[]>(['']);

	const setIngredient = (i: number, patch: Partial<IngredientRow>) =>
		setIngredients((rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
	const removeAt = <T,>(list: T[], i: number) =>
		list.length === 1 ? list : list.filter((_, j) => j !== i);

	const onExtracted = (r: ExtractedRecipe) => {
		setName(r.name);
		setServings(String(r.servings));
		setPrepTime(r.prepTimeMinutes ? String(r.prepTimeMinutes) : '');
		setNotes(r.notes ?? '');
		setIngredients(r.ingredients.map((i) => ({ ...i, quantity: String(i.quantity) })));
		setSteps(r.steps.map((s) => s.description));
	};

	const submit = (e: React.FormEvent) => {
		e.preventDefault();
		const payload: RecipeInput = {
			name: name.trim(),
			servings: Math.max(1, parseInt(servings, 10) || 1),
			prepTimeMinutes: parseInt(prepTime, 10) || undefined,
			bookTitle: bookTitle.trim() || undefined,
			bookPage: parseInt(bookPage, 10) || undefined,
			notes: notes.trim() || undefined,
			ingredients: ingredients
				.filter((i) => i.name.trim())
				.map((i) => ({ quantity: parseFloat(i.quantity) || 0, unit: i.unit, name: i.name })),
			steps: steps.filter((s) => s.trim()).map((description) => ({ description }))
		};
		setError('');
		startTransition(async () => {
			try {
				await createRecipe(payload);
			} catch (e) {
				setError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen');
			}
		});
	};

	return (
		<AppShell action={<BackToRecipesLink />}>
			<PageHeader eyebrow="Eure Sammlung" title="Neues Rezept" />

			<form onSubmit={submit} className="flex flex-col gap-4">
				<ScanUpload onExtracted={onExtracted} />

				<Card title="Rezept-Details">
					<Field.Root required>
						<Field.Label>
							Name <Field.RequiredIndicator />
						</Field.Label>
						<Input
							bg="white"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="z.B. Spaghetti Bolognese"
						/>
					</Field.Root>
					<div className="grid grid-cols-2 gap-3">
						<Field.Root required>
							<Field.Label>
								Portionen im Rezept <Field.RequiredIndicator />
							</Field.Label>
							<Input
								bg="white"
								type="number"
								min={1}
								value={servings}
								onChange={(e) => setServings(e.target.value)}
							/>
						</Field.Root>
						<Field.Root>
							<Field.Label>Zubereitungszeit (Min.)</Field.Label>
							<Input
								bg="white"
								type="number"
								min={1}
								value={prepTime}
								onChange={(e) => setPrepTime(e.target.value)}
							/>
						</Field.Root>
					</div>
				</Card>

				<Card title="Quelle (Buch)">
					<div className="grid grid-cols-[2fr_1fr] gap-3">
						<Field.Root>
							<Field.Label>Buchtitel</Field.Label>
							<Input
								bg="white"
								value={bookTitle}
								onChange={(e) => setBookTitle(e.target.value)}
								placeholder="z.B. Das große Kochbuch"
							/>
						</Field.Root>
						<Field.Root>
							<Field.Label>Seite</Field.Label>
							<Input
								bg="white"
								type="number"
								min={1}
								value={bookPage}
								onChange={(e) => setBookPage(e.target.value)}
							/>
						</Field.Root>
					</div>
				</Card>

				<Card title="Zutaten" hint="Werden auf 1 Portion normalisiert gespeichert.">
					{ingredients.map((row, i) => (
						<div key={i} className="grid grid-cols-[4.5rem_4.5rem_1fr_auto] items-center gap-2">
							<Input
								bg="white"
								type="number"
								step="any"
								min={0}
								placeholder="Menge"
								value={row.quantity}
								onChange={(e) => setIngredient(i, { quantity: e.target.value })}
							/>
							<Input
								bg="white"
								placeholder="Einheit"
								value={row.unit}
								onChange={(e) => setIngredient(i, { unit: e.target.value })}
							/>
							<Input
								bg="white"
								placeholder="Zutat"
								required
								value={row.name}
								onChange={(e) => setIngredient(i, { name: e.target.value })}
							/>
							<RemoveButton
								label="Zutat entfernen"
								disabled={ingredients.length === 1}
								onClick={() => setIngredients(removeAt(ingredients, i))}
							/>
						</div>
					))}
					<AddButton onClick={() => setIngredients([...ingredients, emptyIngredient()])}>
						Zutat hinzufügen
					</AddButton>
				</Card>

				<Card title="Zubereitung">
					{steps.map((text, i) => (
						<div key={i} className="grid grid-cols-[1fr_auto] items-start gap-2">
							<Field.Root>
								<Field.Label fontSize="xs" color="var(--muted)">
									Schritt {i + 1}
								</Field.Label>
								<Textarea
									bg="white"
									rows={2}
									required
									placeholder="Beschreibung dieses Schritts …"
									value={text}
									onChange={(e) => setSteps(steps.map((s, j) => (j === i ? e.target.value : s)))}
								/>
							</Field.Root>
							<div className="pt-6">
								<RemoveButton
									label="Schritt entfernen"
									disabled={steps.length === 1}
									onClick={() => setSteps(removeAt(steps, i))}
								/>
							</div>
						</div>
					))}
					<AddButton onClick={() => setSteps([...steps, ''])}>Schritt hinzufügen</AddButton>
				</Card>

				<Card title="Notizen">
					<Textarea
						bg="white"
						rows={3}
						placeholder="Tipps, Variationen, Hinweise …"
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
					/>
				</Card>

				{error && <p className="text-sm text-red-600">⚠ {error}</p>}
				<div className="flex justify-end gap-3 pt-1">
					<Button asChild rounded="full" variant="ghost" fontWeight="bold">
						<Link href="/recipes">Abbrechen</Link>
					</Button>
					<Button
						type="submit"
						rounded="full"
						colorPalette="brand"
						fontWeight="bold"
						loading={pending}
						loadingText="Speichert …"
					>
						Rezept speichern
					</Button>
				</div>
			</form>
		</AppShell>
	);
}

function Card({
	title,
	hint,
	children
}: {
	title: string;
	hint?: string;
	children: React.ReactNode;
}) {
	return (
		<section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[var(--line)] sm:p-5">
			<div>
				<h2 className="text-xs font-bold tracking-widest text-[var(--green)] uppercase">{title}</h2>
				{hint && <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p>}
			</div>
			{children}
		</section>
	);
}

function RemoveButton({
	label,
	disabled,
	onClick
}: {
	label: string;
	disabled: boolean;
	onClick: () => void;
}) {
	return (
		<IconButton
			type="button"
			aria-label={label}
			size="sm"
			rounded="full"
			variant="ghost"
			disabled={disabled}
			onClick={onClick}
		>
			×
		</IconButton>
	);
}

function AddButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
	return (
		<Button
			type="button"
			alignSelf="flex-start"
			size="sm"
			rounded="full"
			variant="subtle"
			colorPalette="brand"
			fontWeight="bold"
			onClick={onClick}
		>
			<PlusIcon size={14} /> {children}
		</Button>
	);
}
