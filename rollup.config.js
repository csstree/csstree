const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const json = require('rollup-plugin-json');
const { terser } = require('rollup-plugin-terser');

module.exports = {
    input: 'lib/index.js',
    output: [
        { name: 'csstree', format: 'umd', file: 'dist/csstree.js' },
        { name: 'csstree', format: 'umd', file: 'dist/csstree.min.js' }
    ],
    plugins: [
        resolve({ browser: true }),
        commonjs(),
        json(),
        terser({ include: /\.min\./ })
    ]
};
