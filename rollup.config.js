const path = require('path');
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const json = require('rollup-plugin-json');
const { terser } = require('rollup-plugin-terser');
const { lexer } = require('./lib');

function replaceContent(map) {
    return {
        name: 'file-content-replacement',
        load(id) {
            const key = path.relative('', id);
            if (map.hasOwnProperty(key)) {
                return map[key](id);
            }
        }
    };
}

module.exports = {
    input: 'lib/index.js',
    output: [
        { name: 'csstree', format: 'umd', file: 'dist/csstree.js' },
        { name: 'csstree', format: 'umd', file: 'dist/csstree.min.js' }
    ],
    plugins: [
        resolve({ browser: true }),
        replaceContent({
            'data/index.js': () => `module.exports = ${JSON.stringify(lexer.dump(), null, 4)};`,
            'package.json': id => `{ "version": "${require(id).version}" }`
        }),
        commonjs(),
        json(),
        terser({ include: /\.min\./ })
    ]
};
