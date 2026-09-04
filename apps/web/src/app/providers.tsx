'use client';
import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react';
const system = createSystem(defaultConfig, { theme: { tokens: { colors: { brand: { 500: { value: '#1f9d63' }, 600: { value: '#168653' } } } } } });
export function Providers({ children }: { children: React.ReactNode }) { return <ChakraProvider value={system}>{children}</ChakraProvider>; }
