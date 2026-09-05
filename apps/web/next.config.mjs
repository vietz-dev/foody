/** @type {import('next').NextConfig} */
const nextConfig = { agentRules: false, images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] } };
export default nextConfig;
