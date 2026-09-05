'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { BookIcon, CalendarIcon, CartIcon, SettingsIcon } from './icons';

const tabs = [
	{ href: '/plan', label: 'Wochenplan', icon: CalendarIcon },
	{ href: '/recipes', label: 'Rezepte', icon: BookIcon },
	{ href: '/plan/einkaufsliste', label: 'Einkauf', icon: CartIcon },
	{ href: '/settings', label: 'Einstellungen', icon: SettingsIcon }
];

function isActive(pathname: string, href: string) {
	if (href === '/plan') return pathname === '/plan';
	return pathname.startsWith(href);
}

export function Logo({ className = 'text-xl' }: { className?: string }) {
	return (
		<Link href="/" className={`font-black tracking-tight ${className}`}>
			foody<span className="text-[var(--green)]">.</span>
		</Link>
	);
}

export function AppShell({ children, action }: { children: ReactNode; action?: ReactNode }) {
	const pathname = usePathname();
	return (
		<div className="min-h-dvh">
			<header className="sticky top-0 z-20 border-b border-[var(--line)] bg-white/85 pt-[env(safe-area-inset-top)] backdrop-blur">
				<div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
					<Logo />
					<nav className="hidden items-center gap-1 md:flex">
						{tabs.map((t) => {
							const active = isActive(pathname, t.href);
							return (
								<Link
									key={t.href}
									href={t.href}
									className={`rounded-full px-4 py-2 text-sm font-semibold transition ${active ? 'bg-[#e8f4eb] text-[var(--green)]' : 'text-[var(--muted)] hover:text-[var(--ink)]'}`}
								>
									{t.label}
								</Link>
							);
						})}
					</nav>
					<div className="flex items-center gap-2">{action}</div>
				</div>
			</header>

			<main className="mx-auto max-w-4xl px-4 pt-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6 md:pb-12">
				{children}
			</main>

			<nav className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--line)] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
				<ul className="grid grid-cols-4">
					{tabs.map((t) => {
						const active = isActive(pathname, t.href);
						const Icon = t.icon;
						return (
							<li key={t.href}>
								<Link
									href={t.href}
									aria-current={active ? 'page' : undefined}
									className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${active ? 'text-[var(--green)]' : 'text-[var(--muted)]'}`}
								>
									<span className={`rounded-full px-4 py-1 ${active ? 'bg-[#e8f4eb]' : ''}`}>
										<Icon size={22} />
									</span>
									{t.label}
								</Link>
							</li>
						);
					})}
				</ul>
			</nav>
		</div>
	);
}

export function PageHeader({
	eyebrow,
	title,
	subtitle,
	aside
}: {
	eyebrow?: string;
	title: string;
	subtitle?: string;
	aside?: ReactNode;
}) {
	return (
		<div className="mb-5 flex items-end justify-between gap-3">
			<div className="min-w-0">
				{eyebrow && (
					<p className="text-xs font-bold tracking-widest text-[var(--green)] uppercase">
						{eyebrow}
					</p>
				)}
				<h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
				{subtitle && <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>}
			</div>
			{aside && <div className="shrink-0">{aside}</div>}
		</div>
	);
}
