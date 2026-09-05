'use client';
import { useState } from 'react';
import { useServerInsertedHTML } from 'next/navigation';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { ChakraProvider, createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

const config = defineConfig({
	globalCss: {
		html: { colorPalette: 'brand' },
		body: { bg: 'var(--cream)', color: 'var(--ink)' }
	},
	theme: {
		tokens: {
			colors: {
				brand: {
					50: { value: '#eef8f1' },
					100: { value: '#d9efe0' },
					200: { value: '#b5dfc4' },
					300: { value: '#86c9a0' },
					400: { value: '#52ad78' },
					500: { value: '#1f9d63' },
					600: { value: '#168653' },
					700: { value: '#136b44' },
					800: { value: '#115637' },
					900: { value: '#0e472e' },
					950: { value: '#06281a' }
				}
			},
			radii: {
				l1: { value: '0.75rem' },
				l2: { value: '1rem' },
				l3: { value: '1.5rem' }
			}
		},
		semanticTokens: {
			colors: {
				brand: {
					solid: { value: '{colors.brand.500}' },
					contrast: { value: 'white' },
					fg: { value: '{colors.brand.700}' },
					muted: { value: '{colors.brand.100}' },
					subtle: { value: '{colors.brand.50}' },
					emphasized: { value: '{colors.brand.200}' },
					focusRing: { value: '{colors.brand.500}' }
				}
			}
		}
	}
});

export const system = createSystem(defaultConfig, config);

// Streams Emotion styles into <head> during SSR instead of inline <style> tags in <body>,
// which otherwise cause hydration mismatches with the Next.js app router.
function EmotionRegistry({ children }: { children: React.ReactNode }) {
	const [{ cache, flush }] = useState(() => {
		const cache = createCache({ key: 'css' });
		cache.compat = true;
		const prevInsert = cache.insert;
		let inserted: string[] = [];
		cache.insert = (...args) => {
			const serialized = args[1];
			if (cache.inserted[serialized.name] === undefined) inserted.push(serialized.name);
			return prevInsert(...args);
		};
		const flush = () => {
			const prev = inserted;
			inserted = [];
			return prev;
		};
		return { cache, flush };
	});
	useServerInsertedHTML(() => {
		const names = flush();
		if (names.length === 0) return null;
		let styles = '';
		for (const name of names) {
			const rule = cache.inserted[name];
			if (typeof rule === 'string') styles += rule;
		}
		return (
			<style
				data-emotion={`${cache.key} ${names.join(' ')}`}
				dangerouslySetInnerHTML={{ __html: styles }}
			/>
		);
	});
	return <CacheProvider value={cache}>{children}</CacheProvider>;
}

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<EmotionRegistry>
			<ChakraProvider value={system}>{children}</ChakraProvider>
		</EmotionRegistry>
	);
}
