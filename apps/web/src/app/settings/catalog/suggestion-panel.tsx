'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Field, Input } from '@chakra-ui/react';
import type { CatalogEntry } from '@foody/contracts';
import type { CatalogSuggestion, CatalogSuggestionResult } from '@/lib/server/catalog-suggestions';
import { previewCatalogSuggestions, resolveCatalogSuggestion } from './actions';

export function SuggestionPanel({
	entries,
	confirmedIds,
	query
}: {
	entries: CatalogEntry[];
	confirmedIds: string[];
	query: string;
}) {
	const [suggestions, setSuggestions] = useState<CatalogSuggestionResult | null>(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	const byId = new Map(entries.map((entry) => [entry.id, entry]));

	return (
		<section
			className="mb-6 rounded-2xl border border-[var(--line)] bg-[#f3f8f3] p-4 sm:p-5"
			aria-label="KI-Vorschläge"
		>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 className="text-base font-bold">Zutaten automatisch ordnen</h2>
					<p className="mt-1 text-sm text-[var(--muted)]">
						Die KI schlägt Namen und Gruppen vor. Gespeichert wird erst nach deiner Bestätigung.
						{query && <> Aktuelle Suche: „{query}“.</>}
					</p>
				</div>
				<Button
					type="button"
					size="sm"
					rounded="full"
					colorPalette="brand"
					loading={busy}
					onClick={async () => {
						setBusy(true);
						setError('');
						try {
							setSuggestions(await previewCatalogSuggestions(query));
						} catch (cause) {
							setError(
								cause instanceof Error ? cause.message : 'Vorschläge konnten nicht erstellt werden.'
							);
						} finally {
							setBusy(false);
						}
					}}
				>
					Vorschläge erstellen
				</Button>
			</div>
			{error && (
				<p role="alert" className="mt-3 text-sm text-red-700">
					{error}
				</p>
			)}
			{suggestions?.source === 'rules' && (
				<p role="status" className="mt-3 text-sm text-[var(--muted)]">
					{suggestions.reason === 'too_many'
						? 'Mehr als 150 Zutaten gefunden. Bitte die Suche eingrenzen, um die KI zu verwenden.'
						: suggestions.reason === 'missing_key'
							? 'Für KI-Vorschläge fehlt ANTHROPIC_API_KEY.'
							: 'Der KI-Dienst ist derzeit nicht verfügbar.'}{' '}
					Einfache Vorschläge aus Namenszusätzen werden trotzdem angezeigt.
				</p>
			)}
			{suggestions?.groups.length === 0 && (
				<p role="status" className="mt-4 text-sm text-[var(--muted)]">
					Keine sicheren Vorschläge gefunden. Du kannst die Zutaten unten einzeln bearbeiten.
				</p>
			)}
			{suggestions && suggestions.groups.length > 0 && (
				<div className="mt-5 space-y-4">
					<p role="status" className="text-sm font-semibold">
						{suggestions.groups.length} Vorschläge zur Prüfung
					</p>
					{suggestions.groups.map((suggestion) => (
						<SuggestionCard
							key={suggestion.ids.join(':')}
							suggestion={suggestion}
							byId={byId}
							confirmedIds={confirmedIds}
							onDone={() =>
								setSuggestions(
									(current) =>
										current && {
											...current,
											groups: current.groups.filter((item) => item !== suggestion)
										}
								)
							}
						/>
					))}
				</div>
			)}
		</section>
	);
}

function SuggestionCard({
	suggestion,
	byId,
	confirmedIds,
	onDone
}: {
	suggestion: CatalogSuggestion;
	byId: Map<string, CatalogEntry>;
	confirmedIds: string[];
	onDone: () => void;
}) {
	const router = useRouter();
	const [name, setName] = useState(suggestion.name);
	const [selectedIds, setSelectedIds] = useState(suggestion.ids);
	const preferredTarget =
		suggestion.ids.find((id) => byId.get(id)?.name === suggestion.name) ??
		suggestion.ids.find((id) => confirmedIds.includes(id)) ??
		suggestion.ids[0];
	const [targetId, setTargetId] = useState(preferredTarget);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	const selectedTarget = selectedIds.includes(targetId) ? targetId : selectedIds[0];
	const targetProduct = selectedTarget ? byId.get(selectedTarget)?.picnicProductId : null;
	const products = new Map(
		selectedIds.flatMap((id) => {
			const entry = byId.get(id);
			return entry?.picnicProductId
				? [[entry.picnicProductId, entry.picnicProductName ?? entry.picnicProductId] as const]
				: [];
		})
	);

	return (
		<div className="rounded-xl bg-white p-4 ring-1 ring-[var(--line)]">
			<p className="text-xs text-[var(--muted)]">{suggestion.reason}</p>
			<div className="mt-3 grid gap-4 md:grid-cols-2">
				<Field.Root required invalid={!name.trim()}>
					<Field.Label>Einheitlicher Name</Field.Label>
					<Input value={name} onChange={(event) => setName(event.target.value)} disabled={busy} />
					<Field.ErrorText>Bitte einen Namen eingeben.</Field.ErrorText>
				</Field.Root>
				<Field.Root>
					<Field.Label>Zielzutat</Field.Label>
					<select
						value={selectedTarget ?? ''}
						onChange={(event) => setTargetId(event.target.value)}
						disabled={busy || !selectedIds.length}
						className="h-10 rounded-md border border-[var(--line)] bg-white px-3 text-sm"
					>
						{selectedIds.map((id) => (
							<option key={id} value={id}>
								{byId.get(id)?.name}
							</option>
						))}
					</select>
				</Field.Root>
			</div>
			<fieldset className="mt-4">
				<legend className="text-sm font-semibold">Diese Zutaten verknüpfen</legend>
				<div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
					{suggestion.ids.map((id) => (
						<label key={id} className="flex items-center gap-2 text-sm">
							<input
								type="checkbox"
								checked={selectedIds.includes(id)}
								onChange={(event) =>
									setSelectedIds((current) =>
										event.target.checked ? [...current, id] : current.filter((item) => item !== id)
									)
								}
								disabled={busy}
								className="h-4 w-4 accent-[var(--green)]"
							/>
							{byId.get(id)?.name}
						</label>
					))}
				</div>
			</fieldset>
			{products.size > 1 && (
				<p className="mt-3 text-sm font-semibold text-amber-800">
					Unterschiedliche Picnic-Produkte: {[...products.values()].join(', ')}. Wähle die Zielzutat
					mit dem Produkt, das erhalten bleiben soll.
				</p>
			)}
			{error && (
				<p role="alert" className="mt-3 text-sm text-red-700">
					{error}
				</p>
			)}
			<div className="mt-4 flex flex-wrap gap-2">
				<Button
					type="button"
					size="sm"
					rounded="full"
					colorPalette="brand"
					loading={busy}
					disabled={!selectedTarget || !name.trim() || (products.size > 1 && !targetProduct)}
					onClick={async () => {
						if (!selectedTarget) return;
						if (
							products.size > 1 &&
							!window.confirm('Unterschiedliche Picnic-Produkte gefunden. Trotzdem zusammenführen?')
						)
							return;
						setBusy(true);
						setError('');
						try {
							await resolveCatalogSuggestion(
								selectedTarget,
								selectedIds.filter((id) => id !== selectedTarget),
								name,
								products.size > 1
							);
							onDone();
							router.refresh();
						} catch (cause) {
							setError(cause instanceof Error ? cause.message : 'Speichern fehlgeschlagen.');
						} finally {
							setBusy(false);
						}
					}}
				>
					Bestätigen und speichern
				</Button>
				<Button
					type="button"
					size="sm"
					rounded="full"
					variant="ghost"
					disabled={busy}
					onClick={onDone}
				>
					Verwerfen
				</Button>
			</div>
		</div>
	);
}
