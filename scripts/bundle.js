import fs from 'fs';
import path from 'path';
import esbuild from 'esbuild';
import { lexer } from '../lib/index.js';
import { createRequire } from 'module';

const { version } = createRequire(import.meta.url)('../package.json');
const data = JSON.stringify(lexer.dump(), null, 4);

async function build() {
    const genModules = {
        [path.resolve('lib/data.js')]: `export default ${data};`,
        [path.resolve('lib/data.cjs')]: `module.exports = ${data};`,
        [path.resolve('lib/version.js')]: `export const version = "${version}";`,
        [path.resolve('lib/version.cjs')]: `module.exports = "${version}";`
    };
    const genModulesFilter = new RegExp('(' + Object.keys(genModules).join('|').replace(/\./g, '\\.') + ')$');
    const plugins = [{
        name: 'replace',
        setup({ onLoad }) {
            onLoad({ filter: genModulesFilter }, args => ({
                contents: genModules[args.path]
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

    for (const [key, value] of Object.entries(genModules)) {
        const fn = path.basename(key);

        fs.writeFileSync(`dist/${fn}`, value);
    }
}

build();
