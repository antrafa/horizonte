import { copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import { TODOS_OS_SLUGS_DE_ROTA } from './src/core/router';

export default defineConfig({
  base: './',
  plugins: [
    {
      name: 'horizonte-static-routes',
      closeBundle() {
        const distDir = path.resolve('dist');
        const indexHtml = path.join(distDir, 'index.html');
        if (!existsSync(indexHtml)) return;
        for (const slug of [...TODOS_OS_SLUGS_DE_ROTA, '404']) {
          copyFileSync(indexHtml, path.join(distDir, `${slug}.html`));
        }
      },
    },
  ],
});
