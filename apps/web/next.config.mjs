import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const nextConfig = {
	agentRules: false,
	output: 'standalone',
	// Monorepo: trace server files from the repo root (apps/api prisma client, packages/*).
	outputFileTracingRoot: fileURLToPath(new URL('../..', import.meta.url)),
	images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] }
};
export default nextConfig;
