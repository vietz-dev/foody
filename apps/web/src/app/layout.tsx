import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';
export const metadata: Metadata = { title: 'Foody', description: 'Mahlzeitenplanung für euch als Paar.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="de"><body><Providers>{children}</Providers></body></html>; }
