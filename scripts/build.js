import path from 'path';
import esbuild from 'esbuild';
import csstree from '../lib/index.js';
import { createRequire } from 'module';

const { lexer } = csstree;
const { version } = createRequire(import.meta.url)('../package.json');

async function build() {
    const genModules = {
        [path.resolve('data/index.js')]: () => `export default ${JSON.stringify(lexer.dump(), null, 4)};`,
        [path.resolve('lib/version.js')]: () => `export const version = "${version}";`
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
        format: 'esm',
        bundle: true,
        logLevel: 'info',
        plugins
    });

    esbuild.build({
        entryPoints: ['lib/index.js'],
        outfile: 'dist/csstree.min.js',
        format: 'esm',
        bundle: true,
        logLevel: 'info',
        minify: true,
        plugins
    });
}

build();
