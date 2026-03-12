import { defineConfig, type Options } from 'tsup';

// Bundle workspace packages so they don't need to be published separately
const noExternal = [
  '@fizzy-mcp/shared',
  '@fizzy-mcp/client',
  '@fizzy-mcp/tools',
];

const baseConfig: Options = {
  format: ['esm'],
  dts: true,
  sourcemap: true,
  target: 'es2022',
  noExternal,
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
