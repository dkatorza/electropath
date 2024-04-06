import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['./src/index.ts'],
  platform: 'node',
  format: ['cjs', 'esm'],
  dts: true,
});
