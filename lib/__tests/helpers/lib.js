import chalk from 'chalk';
const libPaths = {
    'src': 'lib/index.js'
    // 'dist': 'dist/csstree.js',
    // 'dist-min': 'dist/csstree.min.js'
};
const mode = process.env.MODE || 'src';
const libPath = libPaths[mode];
const postfix = '';

if (!libPaths.hasOwnProperty(mode)) {
    console.error(`Mode ${chalk.white.bgRed(mode)} is not supported!\n`);
    process.exit(1);
}

console.info('Test lib entry:', chalk.yellow(libPath + postfix));

// module.exports = require('../../' + libPath);
export * from '../../index.js';
