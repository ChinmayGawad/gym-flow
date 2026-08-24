import { defineConfig } from 'vitest/config';
import fs from 'fs';
import path from 'path';

// Bun installs real (non-symlinked) package copies per workspace AND per
// hashed store entry. That yields multiple physical React trees, and mixing
// them breaks hooks ("Cannot read properties of null (reading 'useState')").
//
// Fix: pin every Vite-processed import of react/react-dom to the exact tree
// that @testing-library/react -> react-dom resolves to at runtime (the
// react-dom store entry's sibling react copy), so all consumers share ONE
// React instance no matter how each module is loaded.
const r = (p: string) => path.resolve(__dirname, p);
const bunStore = r('../node_modules/.bun');

let reactAlias = r('./node_modules/react');
let reactDomAlias = r('./node_modules/react-dom');

if (fs.existsSync(bunStore)) {
  const reactDomEntry = fs
    .readdirSync(bunStore)
    .find((d) => d.startsWith('react-dom@'));
  if (reactDomEntry) {
    const base = path.join(bunStore, reactDomEntry, 'node_modules');
    if (fs.existsSync(path.join(base, 'react'))) {
      // Point "react" at react-dom's own sibling copy — guaranteed singleton.
      reactAlias = path.join(base, 'react');
      reactDomAlias = path.join(base, 'react-dom');
    }
  }
}

export default defineConfig({
  resolve: {
    alias: {
      '@': r('./src'),
      react: reactAlias,
      'react-dom': reactDomAlias,
    },
    dedupe: ['react', 'react-dom'],
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['./tests/setup.ts'],
    globals: false,
  },
});
