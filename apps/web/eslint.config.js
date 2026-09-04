import { config } from '@repo/eslint-config/index.js';

export default [
	{ ignores: ['.next/**'] },
	...config
];
