'use client';
import { useState } from 'react';
import { Button } from '@chakra-ui/react';
import { createAuthClient } from 'better-auth/react';
import { genericOAuthClient } from 'better-auth/client/plugins';
import { Logo } from '../../components/app-shell';

const authClient = createAuthClient({ plugins: [genericOAuthClient()] });

export default function LoginPage() {
	const [loading, setLoading] = useState(false);
	const signIn = async () => {
		setLoading(true);
		await authClient.signIn.oauth2({ providerId: 'pocket-id', callbackURL: '/' });
	};
	return (
		<main className="flex min-h-dvh flex-col items-center justify-center p-5">
			<div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-[var(--line)] sm:p-10">
				<Logo className="text-3xl" />
				<h1 className="mt-8 text-2xl font-black tracking-tight">Willkommen zurück</h1>
				<p className="mt-2 text-sm leading-6 text-[var(--muted)]">
					Meldet euch an und plant die nächste leckere Woche.
				</p>
				<Button
					mt="8"
					w="full"
					size="lg"
					rounded="full"
					colorPalette="brand"
					fontWeight="bold"
					loading={loading}
					loadingText="Weiterleitung …"
					onClick={signIn}
				>
					Mit Pocket ID anmelden
				</Button>
				<p className="mt-5 text-xs text-[var(--muted)]">Sicher authentifiziert mit Better Auth.</p>
			</div>
		</main>
	);
}
