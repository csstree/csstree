var resolve = require('rollup-plugin-node-resolve');
var commonjs = require('rollup-plugin-commonjs');
var json = require('rollup-plugin-json');

module.exports = {
    input: 'lib/index.js',
    output: {
        file: 'dist/csstree.js',
        name: 'csstree',
        format: 'umd'
    },
    plugins: [
        resolve({ browser: true }),
        json(),
        commonjs()
    ]
};
