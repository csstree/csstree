const fs = require('fs');
const path = require('path');
const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const { terser } = require('rollup-plugin-terser');
const genSyntaxDataFile = require('./scripts/gen-syntax-data');

genSyntaxDataFile();
fs.writeFileSync(
    path.join(__dirname, 'dist/version.js'),
    'module.exports = ' + JSON.stringify(require('./package.json').version)
);

module.exports = {
    input: 'lib/index.js',
    output: [
        { name: 'csstree', format: 'umd', file: 'dist/csstree.js' },
        { name: 'csstree', format: 'umd', file: 'dist/csstree.min.js' }
    ],
    plugins: [
        resolve({ browser: true }),
        commonjs(),
        terser({ include: /\.min\./ })
    ]
};
