import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import { eslint } from 'rollup-plugin-eslint';
import uglify from 'rollup-plugin-uglify-es';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/bundle.js',
    format: 'cjs',
  },
  plugins: [
    eslint({
      throwOnError: true,
      throwOnWarning: true,
    }),
    commonjs(),
    json(),
    // (process.env.NODE_ENV === 'production' ? uglify({
    //   output: {
    //     beautify: false,
    //   },
    // }) : null),
  ],
};
