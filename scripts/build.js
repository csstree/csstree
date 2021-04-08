const path = require('path');
const esbuild = require('esbuild');
const { lexer } = require('../lib');

async function build() {
    const genModules = {
        [path.resolve('data/index.js')]: () => `module.exports = ${JSON.stringify(lexer.dump(), null, 4)};`,
        [path.resolve('package.json')]: () => `module.exports = { "version": "${require('../package.json').version}" }`
    };
    const genModulesFilter = new RegExp('(' + Object.keys(genModules).join('|').replace(/\./g, '\\.') + ')$');
    const genModuleCache = new Map();
    const genModule = (fn) => {
        if (!genModuleCache.has(fn)) {
            genModuleCache.set(fn, genModules[fn]());
        }

        return genModuleCache.get(fn);
    };
    const plugins = [{
        name: 'replace',
        setup({ onLoad }) {
            onLoad({ filter: genModulesFilter }, args => ({
                contents: genModule(args.path)
            }));
        }
    }];

    esbuild.build({
        entryPoints: ['lib/index.js'],
        outfile: 'dist/csstree.js',
        format: 'cjs',
        bundle: true,
        logLevel: 'info',
        plugins
    });

    esbuild.build({
        entryPoints: ['lib/index.js'],
        outfile: 'dist/csstree.min.js',
        format: 'cjs',
        bundle: true,
        logLevel: 'info',
        minify: true,
        plugins
    });
}

build();
