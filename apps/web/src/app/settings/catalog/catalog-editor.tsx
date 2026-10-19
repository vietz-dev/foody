'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Field, Input } from '@chakra-ui/react';
import type { CatalogEntry } from '@foody/contracts';
import {
	detachCatalogExpression,
	importRecipeIngredients,
	mergeCatalogEntry,
	saveCatalogEntry
} from './actions';
import { SuggestionPanel } from './suggestion-panel';
import { GroupPicker } from './group-picker';

type View = 'pending' | 'confirmed';

export function CatalogEditor({
	pending,
	confirmed
}: {
	pending: CatalogEntry[];
	confirmed: CatalogEntry[];
}) {
	const [view, setView] = useState<View>('pending');
	const [query, setQuery] = useState('');
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [importing, setImporting] = useState(false);
	const [importMessage, setImportMessage] = useState('');
	const router = useRouter();
	const all = [...pending, ...confirmed];
	const entries = view === 'pending' ? pending : confirmed;
	const visible = entries.filter((entry) =>
		[entry.name, ...entry.aliases].some((name) =>
			name.toLocaleLowerCase('de').includes(query.trim().toLocaleLowerCase('de'))
		)
	);
	const selected = all.find((entry) => entry.id === selectedId) ?? visible[0];

	return (
		<div className="mt-6">
			<Field.Root className="mb-4">
				<Field.Label>Zutaten suchen</Field.Label>
				<Input
					value={query}
					onChange={(event) => {
						setQuery(event.target.value);
						setSelectedId(null);
					}}
					placeholder="Name oder Alias …"
					bg="white"
					rounded="xl"
				/>
			</Field.Root>
			<SuggestionPanel
				key={query}
				entries={all}
				confirmedIds={confirmed.map((entry) => entry.id)}
				query={query}
			/>
			<div className="mb-5 rounded-2xl border border-[var(--line)] bg-white p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
				<div>
					<h2 className="text-sm font-bold">Bestehende Rezepte erfassen</h2>
					<p className="mt-1 text-xs text-[#59665d]">
						Verknüpft alte Rezeptzutaten mit dem Katalog. Neue Namen erscheinen unter „Zu prüfen“.
					</p>
				</div>
				<Button
					className="mt-3 sm:mt-0"
					size="sm"
					rounded="full"
					variant="outline"
					loading={importing}
					onClick={async () => {
						setImporting(true);
						try {
							const result = await importRecipeIngredients();
							setImportMessage(`${result.linkedCount} Rezeptzutaten verknüpft.`);
							router.refresh();
						} catch (cause) {
							setImportMessage(cause instanceof Error ? cause.message : 'Import fehlgeschlagen.');
						} finally {
							setImporting(false);
						}
					}}
				>
					Rezepte erfassen
				</Button>
			</div>
			{importMessage && (
				<p role="status" className="mb-4 text-sm font-semibold">
					{importMessage}
				</p>
			)}
			<div className="flex flex-wrap gap-2" role="group" aria-label="Katalogansicht">
				{(['pending', 'confirmed'] as const).map((tab) => (
					<Button
						key={tab}
						size="sm"
						rounded="full"
						colorPalette="brand"
						variant={view === tab ? 'solid' : 'outline'}
						bg={view === tab ? '#137548' : undefined}
						_hover={view === tab ? { bg: '#0e603a' } : undefined}
						aria-pressed={view === tab}
						onClick={() => {
							setView(tab);
							setSelectedId(null);
						}}
					>
						{tab === 'pending'
							? `Zu prüfen (${pending.length})`
							: `Bestätigt (${confirmed.length})`}
					</Button>
				))}
			</div>
			<div className="mt-4 grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
				<section aria-label="Zutaten auswählen">
					{visible.length ? (
						<ul className="mt-3 max-h-[32rem] overflow-y-auto rounded-2xl bg-white shadow-sm ring-1 ring-[var(--line)]">
							{visible.map((entry) => (
								<li key={entry.id} className="border-b border-[var(--line)] last:border-0">
									<button
										type="button"
										onClick={() => setSelectedId(entry.id)}
										aria-current={selected?.id === entry.id ? 'true' : undefined}
										className={`w-full px-4 py-3 text-left text-sm font-semibold hover:bg-[#f3f8f3] ${selected?.id === entry.id ? 'bg-[#e8f4eb] text-[#126b43]' : 'text-[var(--ink)]'}`}
									>
										{entry.name}
										{entry.expressions.length > 1 && (
											<span className="ml-2 text-xs font-normal text-[#526257]">
												{entry.expressions.length} Ausdrücke
											</span>
										)}
										{entry.isStaple && <span className="ml-2 text-xs font-normal">Vorrat</span>}
									</button>
								</li>
							))}
						</ul>
					) : (
						<p className="mt-3 rounded-2xl border border-dashed border-[var(--line)] p-5 text-sm text-[var(--muted)]">
							Keine Zutaten gefunden.
						</p>
					)}
				</section>
				<section aria-label="Zutat bearbeiten">
					{selected ? (
						<EntryForm
							key={selected.id}
							entry={selected}
							groups={confirmed}
							onSaved={() => setSelectedId(null)}
						/>
					) : (
						<p className="rounded-2xl border border-dashed border-[var(--line)] p-5 text-sm text-[var(--muted)]">
							Wähle eine Zutat aus.
						</p>
					)}
				</section>
			</div>
		</div>
	);
}

function EntryForm({
	entry,
	groups,
	onSaved
}: {
	entry: CatalogEntry;
	groups: CatalogEntry[];
	onSaved: () => void;
}) {
	const router = useRouter();
	const [name, setName] = useState(entry.name);
	const [isStaple, setIsStaple] = useState(entry.isStaple);
	const [targetId, setTargetId] = useState('');
	const [pickerOpen, setPickerOpen] = useState(false);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	const [notice, setNotice] = useState('');
	const targets = groups
		.filter((candidate) => candidate.id !== entry.id)
		.sort((a, b) => a.name.localeCompare(b.name, 'de'));
	const target = targets.find((candidate) => candidate.id === targetId);

	const run = async (action: () => Promise<void>, success: string) => {
		setBusy(true);
		setError('');
		setNotice('');
		try {
			await action();
			setNotice(success);
			onSaved();
			router.refresh();
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : 'Änderung fehlgeschlagen.');
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[var(--line)] sm:p-6">
			<h2 className="text-lg font-bold">{entry.name}</h2>
			{entry.aliases.length > 0 && (
				<p className="mt-1 text-xs text-[#59665d]">Auch bekannt als: {entry.aliases.join(', ')}</p>
			)}
			<form
				className="mt-5 space-y-4"
				onSubmit={(event) => {
					event.preventDefault();
					void run(() => saveCatalogEntry(entry.id, name, isStaple), 'Zutat gespeichert.');
				}}
			>
				<Field.Root required invalid={!name.trim()}>
					<Field.Label>Einheitlicher Name</Field.Label>
					<Input
						value={name}
						onChange={(event) => setName(event.target.value)}
						disabled={busy}
						rounded="xl"
					/>
					<Field.HelperText>Dieser Name erscheint künftig in der Einkaufsliste.</Field.HelperText>
					<Field.ErrorText>Bitte einen Namen eingeben.</Field.ErrorText>
				</Field.Root>
				<label className="flex items-center gap-3 text-sm font-medium">
					<input
						type="checkbox"
						checked={isStaple}
						onChange={(event) => setIsStaple(event.target.checked)}
						disabled={busy}
						className="h-4 w-4 accent-[var(--green)]"
					/>
					Im Vorrat prüfen
				</label>
				<Button
					type="submit"
					size="sm"
					rounded="full"
					colorPalette="brand"
					bg="#137548"
					_hover={{ bg: '#0e603a' }}
					loading={busy}
					disabled={!name.trim()}
				>
					Speichern und bestätigen
				</Button>
			</form>
			<div className="mt-6 border-t border-[var(--line)] pt-5">
				<h3 className="text-sm font-bold">Mitglieder dieser Zutatengruppe</h3>
				<p className="mt-1 text-xs text-[#59665d]">
					Diese Ausdrücke werden in Rezepten und der Einkaufsliste als „{entry.name}“ gesammelt.
				</p>
				<ul className="mt-3 divide-y divide-[var(--line)] rounded-xl border border-[var(--line)] bg-[#fbfcf9] px-3">
					{entry.expressions.map((expression) => (
						<li
							key={expression.id}
							className="flex flex-col items-start gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
						>
							<span className="min-w-0 text-sm break-words">{expression.name}</span>
							{entry.expressions.length > 1 && (
								<Button
									type="button"
									size="xs"
									variant="ghost"
									colorPalette="brand"
									className="shrink-0"
									disabled={busy}
									onClick={() =>
										void run(
											() => detachCatalogExpression(expression.id),
											'Ausdruck aus der Gruppe gelöst.'
										)
									}
								>
									Aus Gruppe lösen
								</Button>
							)}
						</li>
					))}
				</ul>
			</div>
			{targets.length > 0 && (
				<div className="mt-6 border-t border-[var(--line)] pt-5">
					<h3 className="text-sm font-bold">Zu bestehender Zutatengruppe hinzufügen</h3>
					<p className="mt-1 text-xs text-[#59665d]">
						Alle Ausdrücke dieses Eintrags werden der gewählten bestätigten Gruppe zugeordnet. Du
						kannst sie später einzeln wieder lösen.
					</p>
					<p className="mt-3 text-sm font-medium">Zutatengruppe</p>
					<Button
						className="mt-1 w-full justify-start"
						type="button"
						variant="outline"
						rounded="xl"
						disabled={busy}
						aria-haspopup="dialog"
						onClick={() => setPickerOpen(true)}
					>
						{target ? target.name : 'Gruppe suchen …'}
					</Button>
					{pickerOpen && (
						<GroupPicker
							groups={targets}
							selectedId={targetId}
							onSelect={(id) => {
								setTargetId(id);
								setPickerOpen(false);
							}}
							onClose={() => setPickerOpen(false)}
						/>
					)}
					<Button
						className="mt-3"
						type="button"
						size="sm"
						rounded="full"
						variant="outline"
						disabled={!targetId || busy}
						onClick={() => {
							if (
								target &&
								window.confirm(`„${entry.name}“ zur Gruppe „${target.name}“ hinzufügen?`)
							) {
								void run(() => mergeCatalogEntry(entry.id, target.id), 'Zur Gruppe hinzugefügt.');
							}
						}}
					>
						Zur Gruppe hinzufügen
					</Button>
				</div>
			)}
			{error && (
				<p role="alert" className="mt-4 text-sm font-semibold text-red-700">
					{error}
				</p>
			)}
			{notice && (
				<p role="status" className="mt-4 text-sm font-semibold text-[var(--green)]">
					{notice}
				</p>
			)}
		</div>
	);
}
