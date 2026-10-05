import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export default defineConfig({
  plugins: [react(), {
    name: 'version-service-worker',
    enforce: 'post',
    generateBundle(_, bundle) {
      const template = readFileSync(new URL('./public/sw.js', import.meta.url), 'utf8');
      const hash = createHash('sha256').update(template);
      for (const [name, output] of Object.entries(bundle).sort(([a], [b]) => a.localeCompare(b))) {
        hash.update(name).update(output.type === 'chunk' ? output.code : output.source);
      }
      const assets = Object.keys(bundle).filter(name => name.startsWith('assets/')).map(name => `/${name}`);
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: template.replace('__BUILD_VERSION__', hash.digest('hex').slice(0, 16))
          .replace('const BUILD_ASSETS = [];', `const BUILD_ASSETS = ${JSON.stringify(assets)};`),
      });
    },
  }],
});
