import { config } from '@repo/eslint-config/index.js';

export default [
	{ ignores: ['src/routes/**', 'src/lib/components/**', 'src/lib/styles.ts', 'src/lib/index.ts'] },
	...config
];
