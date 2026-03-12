import { defineConfig, type Options } from 'tsup';

const baseConfig: Options = {
  format: ['esm'],
  dts: true,
  sourcemap: true,
  target: 'es2022',
};

export default defineConfig([
  {
    ...baseConfig,
    entry: ['src/index.ts'],
    clean: true,
  },
  {
    ...baseConfig,
    entry: ['src/cli.ts'],
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
]);
