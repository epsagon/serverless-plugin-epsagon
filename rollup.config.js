import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import { eslint } from 'rollup-plugin-eslint';
import uglify from 'rollup-plugin-uglify-es';
import babel from 'rollup-plugin-babel';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/bundle.js',
    format: 'cjs',
  },
  plugins: [
    (process.env.NODE_ENV === 'production' ? eslint({
      throwOnError: true,
      throwOnWarning: true,
    }) : null),
    json(),
    babel({
      runtimeHelpers: true,
      exclude: 'node_modules/**',
    }),
    commonjs(),
    (process.env.NODE_ENV === 'production' ? uglify({
      output: {
        beautify: false,
      },
    }) : null),
  ],
};
