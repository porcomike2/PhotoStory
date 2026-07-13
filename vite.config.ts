import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Inline plugin: injects a build-unique version into the service worker at build time.
// Each build gets a different timestamp, so the SW cache name changes automatically,
// invalidating the old cache on every deployment without manual version bumps.
function swVersionPlugin() {
  const virtualId = '/sw-cache-version';
  let version = '';

  return {
    name: 'sw-cache-version',
    configResolved() {
      // Generate a unique version string for this build
      version = `photostory-${Date.now()}`;
    },
    resolveId(id) {
      if (id === virtualId) return virtualId;
      return null;
    },
    load(id) {
      if (id === virtualId) return `export default ${JSON.stringify(version)};`;
      return null;
    },
    writeBundle(options) {
      // Replace the placeholder in the built service-worker.js
      const outDir = options.dir || 'dist';
      const swPath = join(outDir, 'service-worker.js');
      try {
        let content = readFileSync(swPath, 'utf-8');
        content = content.replace('__SW_CACHE_VERSION__', version);
        writeFileSync(swPath, content, 'utf-8');
      } catch {
        // SW file may not exist if public dir wasn't copied yet; skip silently
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), swVersionPlugin()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
