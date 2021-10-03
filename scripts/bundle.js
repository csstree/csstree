import fs from 'fs';
import path from 'path';
import esbuild from 'esbuild';
import { lexer } from '../lib/index.js';
import { createRequire } from 'module';

const { version } = createRequire(import.meta.url)('../package.json');

async function build() {
    const genModules = {
        [path.resolve('lib/data.js')]: () => `export default ${JSON.stringify(lexer.dump(), null, 4)};`,
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

    await Promise.all([
        esbuild.build({
            entryPoints: ['lib/index.js'],
            outfile: 'dist/csstree.js',
            format: 'iife',
            globalName: 'csstree',
            bundle: true,
            minify: true,
            logLevel: 'info',
            plugins
        }),

        esbuild.build({
            entryPoints: ['lib/index.js'],
            outfile: 'dist/csstree.esm.js',
            format: 'esm',
            bundle: true,
            minify: true,
            logLevel: 'info',
            plugins
        })
    ]);

    for (const [key, value] of genModuleCache) {
        const fn = path.basename(key);
        fs.writeFileSync(`dist/${fn}`, value);
    }
}

build();
