import fs from 'fs';
import path from 'path';
import { rollup } from 'rollup';

function removeCreateRequire(id) {
    return fs.readFileSync(id, 'utf8')
        .replace(/import .+ from 'module';/, '')
        .replace(/const require = .+;/, '');
}

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
};

async function build() {
    const testsDir = 'lib/__tests';
    const outputDir = './cjs';
    const startTime = Date.now();

    console.log();
    console.log(`Convert ESM to CommonJS (output: ${outputDir})`);

    const tests = fs.readdirSync(testsDir)
        .filter(fn => fn.endsWith('.js'))
        .map(fn => `${testsDir}/${fn}`);

    const res = await rollup({
        external: [
            'module',
            'fs',
            'path',
            'assert',
            'chalk',
            'json-to-ast',
            'css-tree',
            /^source-map/
        ],
        input: ['lib/index.js', ...tests],
        plugins: [
            replaceContent({
                'lib/data.js': removeCreateRequire,
                'lib/data-patch.js': removeCreateRequire,
                'lib/version.js': removeCreateRequire
            })
        ]
    });
    await res.write({
        dir: outputDir,
        entryFileNames: '[name].cjs',
        format: 'cjs',
        exports: 'auto',
        preserveModules: true,
        interop: false,
        esModule: false,
        generatedCode: {
            constBindings: true
        }
    });
    await res.close();

    console.log(`Done in ${Date.now() - startTime}ms`);
}

build();
