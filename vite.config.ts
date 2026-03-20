import { defineConfig } from 'vite-plus';

export default defineConfig({
  lint: {
    options: { typeAware: true, typeCheck: true },
    ignorePatterns: ['docs/'],
  },
  fmt: {
    semi: true,
    singleQuote: true,
    tabWidth: 2,
    trailingComma: 'all',
    printWidth: 100,
    bracketSpacing: true,
    sortPackageJson: false,
    ignorePatterns: ['dist/', 'node_modules/', '.turbo/', 'pnpm-lock.yaml', '*.md'],
  },
});
