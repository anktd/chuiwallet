import { defineConfig } from 'vite';
import { watchRebuildPlugin } from '@extension/hmr';
import react from '@vitejs/plugin-react-swc';
import deepmerge from 'deepmerge';
import { isDev, isProduction } from './env.mjs';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export const watchOption = isDev
  ? {
      buildDelay: 100,
      chokidar: {
        ignored: [/\/packages\/.*\.(ts|tsx|map)$/],
      },
    }
  : undefined;

/**
 * @typedef {import('vite').UserConfig} UserConfig
 * @param {UserConfig} config
 * @returns {UserConfig}
 */
export function withPageConfig(config) {
  return defineConfig(
    deepmerge(
      {
        base: '',
        plugins: [
          react(),
          isDev && watchRebuildPlugin({ refresh: true }),
          nodePolyfills({
            // Specific modules that should not be polyfilled.
            exclude: [],
            // Whether to polyfill specific globals.
            globals: {
              Buffer: true, // can also be 'build', 'dev', or false
              global: true,
              process: true,
            },
            // Whether to polyfill `node:` protocol imports.
            protocolImports: true,
          }),
        ],
        build: {
          sourcemap: isDev,
          minify: isProduction,
          reportCompressedSize: isProduction,
          emptyOutDir: isProduction,
          watch: watchOption,
          rollupOptions: {
            external: ['chrome'],
          },
        },
        define: {
          'process.env.NODE_ENV': isDev ? `"development"` : `"production"`,
        },
        envDir: '../..',
      },
      config,
    ),
  );
}
