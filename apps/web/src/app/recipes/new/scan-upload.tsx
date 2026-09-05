'use client';
import { useRef, useState } from 'react';
import { Button } from '@chakra-ui/react';
import type { ExtractedRecipe } from '../../../lib/server/recipe-extractor';

export function ScanUpload({ onExtracted }: { onExtracted: (recipe: ExtractedRecipe) => void }) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [files, setFiles] = useState<File[]>([]);
	const [scanning, setScanning] = useState(false);
	const [error, setError] = useState('');

	const scan = async () => {
		if (files.length === 0) return setError('Bitte zuerst Fotos auswählen.');
		setScanning(true);
		setError('');
		const body = new FormData();
		files.forEach((f) => body.append('images', f));
		try {
			const res = await fetch('/api/recipes/scan', { method: 'POST', body });
			if (!res.ok) throw new Error(`Fehler ${res.status}: ${await res.text()}`);
			onExtracted(await res.json());
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Unbekannter Fehler');
		} finally {
			setScanning(false);
		}
	};

	return (
		<section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[var(--line)] sm:p-5">
			<h2 className="text-xs font-bold tracking-widest text-[var(--green)] uppercase">
				📖 Aus Buch scannen (optional)
			</h2>
			<p className="mt-1 text-sm text-[var(--muted)]">
				Fotos der Zutaten- und Schritte-Seiten hochladen. Claude füllt das Formular aus.
			</p>
			<input
				ref={inputRef}
				type="file"
				accept="image/*"
				multiple
				hidden
				onChange={(e) => setFiles([...files, ...Array.from(e.target.files ?? [])])}
			/>
			<div className="mt-3 flex flex-wrap gap-2">
				<Button
					type="button"
					size="sm"
					rounded="full"
					variant="outline"
					fontWeight="bold"
					onClick={() => inputRef.current?.click()}
				>
					Fotos auswählen
				</Button>
				<Button
					type="button"
					size="sm"
					rounded="full"
					colorPalette="brand"
					fontWeight="bold"
					loading={scanning}
					loadingText="Scannt …"
					disabled={files.length === 0}
					onClick={scan}
				>
					Rezept scannen
				</Button>
			</div>
			{files.length > 0 && (
				<ul className="mt-3 flex flex-col gap-1">
					{files.map((f, i) => (
						<li
							key={f.name + f.size}
							className="flex items-center justify-between rounded-lg bg-[#f1f2ee] px-3 py-1.5 text-xs"
						>
							<span className="truncate">{f.name}</span>
							<button
								type="button"
								aria-label={`${f.name} entfernen`}
								className="ml-2 text-[var(--muted)] hover:text-red-600"
								onClick={() => setFiles(files.filter((_, j) => j !== i))}
							>
								×
							</button>
						</li>
					))}
				</ul>
			)}
			{error && <p className="mt-2 text-xs text-red-600">⚠ {error}</p>}
		</section>
	);
}
