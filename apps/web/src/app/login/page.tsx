'use client';
import Link from 'next/link';
import { useState } from 'react';
import { createAuthClient } from 'better-auth/react';
import { genericOAuthClient } from 'better-auth/client/plugins';

const authClient = createAuthClient({ plugins: [genericOAuthClient()] });
export default function LoginPage() { const [loading, setLoading] = useState(false); const signIn = async () => { setLoading(true); await authClient.signIn.oauth2({ providerId: 'pocket-id', callbackURL: '/' }); }; return <main className="flex min-h-screen items-center justify-center bg-[var(--cream)] p-6"><div className="w-full max-w-md rounded-[2rem] bg-white p-10 text-center shadow-xl shadow-green-900/5"><Link href="/" className="text-3xl font-black">foody<span className="text-[var(--green)]">.</span></Link><div className="mx-auto mt-10 max-w-xs"><h1 className="text-3xl font-black">Willkommen zurück</h1><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Meldet euch an und plant die nächste leckere Woche.</p><button onClick={signIn} disabled={loading} className="mt-8 w-full rounded-full bg-[var(--green)] px-5 py-3 font-bold text-white disabled:opacity-60">{loading ? 'Weiterleitung…' : 'Mit Pocket ID anmelden'}</button><p className="mt-6 text-xs text-[var(--muted)]">Sicher authentifiziert mit Better Auth.</p></div></div></main>; }
