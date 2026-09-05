// Bundle src/index.ts into dist/index.js.
// Workspace packages (`workspace:*`) export raw .ts, so they are inlined;
// every other dependency stays external and is loaded from node_modules.
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';

function externals(dir, seen = new Set()) {
  const pkg = JSON.parse(readFileSync(`${dir}/package.json`, 'utf8'));
  for (const [name, range] of Object.entries(pkg.dependencies ?? {})) {
    if (range.startsWith('workspace:')) externals(`${dir}/node_modules/${name}`, seen);
    else seen.add(name);
  }
  return [...seen];
}

await build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.js',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  external: externals('.')
});
