import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const CONTENT = resolve('src/content.js');
const RENDER = resolve('src/site/render.js');

/** Renders src/content.js into index.html so every word is static, crawlable DOM. */
function resumeContent() {
  return {
    name: 'resume-content',
    async transformIndexHtml(html) {
      const bust = `?t=${Date.now()}`; // re-read edits in dev without restarting
      const content = await import(pathToFileURL(CONTENT).href + bust);
      const { renderHead, renderBody } = await import(pathToFileURL(RENDER).href + bust);
      return html.replace('<!--@head-->', renderHead(content)).replace('<!--@body-->', renderBody(content));
    },
    handleHotUpdate({ file, server }) {
      if (file === CONTENT || file === RENDER) {
        server.ws.send({ type: 'full-reload' });
        return [];
      }
    },
  };
}

export default defineConfig({
  base: './', // relative asset URLs → works on any GitHub Pages sub-path
  plugins: [resumeContent()],
  build: {
    target: 'es2022',
    assetsInlineLimit: 0, // keep atlases/fonts as separate cacheable files (atlases are lazy-loaded)
    modulePreload: { polyfill: false },
    chunkSizeWarningLimit: 1200,
  },
});
