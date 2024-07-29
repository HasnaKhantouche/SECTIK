import svelte from 'rollup-plugin-svelte';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import sveltePreprocess from 'svelte-preprocess';
import css from 'rollup-plugin-css-only';

const production = !process.env.ROLLUP_WATCH;

export default {
  input: 'webviews/pages/sidebar.ts',
  output: {
    sourcemap: true,
    format: 'iife',
    name: 'app',
    file: 'out/compiled/sidebar.js'
  },
  plugins: [
    svelte({
      preprocess: sveltePreprocess(),
      compilerOptions: {
        dev: !production
      }
    }),
    resolve({
      browser: true,
      dedupe: ['svelte']
    }),
    commonjs(),
    typescript({
      tsconfig: 'webviews/tsconfig.json',
      sourceMap: !production,
      inlineSources: !production
    }),
    css({ output: 'out/compiled/sidebar.css' })
  ],
  watch: {
    clearScreen: false
  }
};
