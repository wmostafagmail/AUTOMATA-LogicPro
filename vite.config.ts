import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

const ignoredGeneratedArtifactGlobs = [
  '**/FPGA Projects/**',
  '**/AI Generated TB/**',
  '**/AI Generated RTL/**',
  '**/AI Generated Assertions/**',
  '**/.automata-logicpro/**',
  '**/work-obj08.cf',
  '**/*.o',
  '**/*.cf',
  '**/*.vcd',
  '**/*.ghw',
  '**/*.fst',
  '**/*.svg',
];

export default defineConfig(() => {
  const useTailwindVitePlugin = process.env.DISABLE_TAILWIND_VITE !== 'true';
  const transformTracePath = process.env.VITE_TRANSFORM_TRACE_PATH || '';

  return {
    plugins: [
      transformTracePath
        ? {
            name: 'logicpro-transform-trace',
            transform(_code, id) {
              fs.appendFileSync(transformTracePath, `${id}\n`);
              return null;
            },
          }
        : null,
      react(),
      useTailwindVitePlugin ? tailwindcss() : null,
    ].filter(Boolean),
    resolve: {
      alias: [
        {find: /^lucide-react$/, replacement: path.resolve(__dirname, 'src/vendor/lucide-react.ts')},
        {find: '@', replacement: path.resolve(__dirname, '.')},
      ],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify-file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true'
        ? null
        : {
            ignored: ignoredGeneratedArtifactGlobs,
          },
    },
  };
});
