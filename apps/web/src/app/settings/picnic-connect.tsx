'use client';
import { useState } from 'react';
import { Button, Input } from '@chakra-ui/react';
import { connectPicnic, disconnectPicnic, verifyPicnic2fa } from './actions';

type Status = { status: 'disconnected' | 'pending_2fa' | 'connected'; email: string | null };

export function PicnicConnect({ initial }: { initial: Status }) {
	const [state, setState] = useState(initial);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [code, setCode] = useState('');
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');

	const run = async (action: () => Promise<{ status: string; message?: string } | void>) => {
		setBusy(true);
		setError('');
		try {
			const result = await action();
			if (result?.status === 'failed') setError(result.message ?? 'Fehlgeschlagen');
			else if (result?.status === '2fa_required') setState({ status: 'pending_2fa', email });
			else if (result?.status === 'connected')
				setState({ status: 'connected', email: state.email ?? email });
			else setState({ status: 'disconnected', email: null });
			setPassword('');
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Unbekannter Fehler');
		} finally {
			setBusy(false);
		}
	};

	return (
		<section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[var(--line)] sm:p-6">
			<p className="text-xs font-bold tracking-widest text-[var(--green)] uppercase">Picnic</p>
			<h2 className="mt-1 text-xl font-black">Picnic-Konto verbinden</h2>
			<p className="mt-1 text-sm leading-6 text-[var(--muted)]">
				Damit die Einkaufsliste per Knopfdruck in deinen Picnic-Warenkorb wandert. Wir speichern nur
				das Sitzungs-Token, nie dein Passwort. Bestellen und bezahlen bleibt in der Picnic-App.
			</p>

			{state.status === 'connected' && (
				<div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-[#e8f4eb] px-4 py-3">
					<div className="min-w-0">
						<p className="text-sm font-bold">Verbunden</p>
						<p className="truncate text-xs text-[var(--muted)]">{state.email}</p>
					</div>
					<Button
						size="sm"
						rounded="full"
						variant="outline"
						bg="white"
						loading={busy}
						onClick={() => run(disconnectPicnic)}
					>
						Trennen
					</Button>
				</div>
			)}

			{state.status === 'pending_2fa' && (
				<form
					className="mt-4 grid gap-3"
					onSubmit={(e) => {
						e.preventDefault();
						run(() => verifyPicnic2fa(code.trim()));
					}}
				>
					<p className="text-sm">
						Picnic hat dir einen Code per SMS geschickt. Bitte hier eingeben.
					</p>
					<Input
						size="lg"
						rounded="xl"
						inputMode="numeric"
						autoComplete="one-time-code"
						placeholder="Code aus der SMS"
						value={code}
						onChange={(e) => setCode(e.target.value)}
					/>
					<div className="flex gap-2">
						<Button
							type="submit"
							size="lg"
							rounded="full"
							colorPalette="brand"
							fontWeight="bold"
							loading={busy}
						>
							Bestätigen
						</Button>
						<Button
							type="button"
							size="lg"
							rounded="full"
							variant="ghost"
							onClick={() => run(disconnectPicnic)}
						>
							Abbrechen
						</Button>
					</div>
				</form>
			)}

			{state.status === 'disconnected' && (
				<form
					className="mt-4 grid gap-3"
					onSubmit={(e) => {
						e.preventDefault();
						run(() => connectPicnic(email.trim(), password));
					}}
				>
					<Input
						size="lg"
						rounded="xl"
						type="email"
						autoComplete="username"
						placeholder="E-Mail bei Picnic"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
					/>
					<Input
						size="lg"
						rounded="xl"
						type="password"
						autoComplete="current-password"
						placeholder="Passwort"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
					/>
					<Button
						type="submit"
						size="lg"
						rounded="full"
						colorPalette="brand"
						fontWeight="bold"
						loading={busy}
					>
						Verbinden
					</Button>
				</form>
			)}

			{error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
		</section>
	);
}
