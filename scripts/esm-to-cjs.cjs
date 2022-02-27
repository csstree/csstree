// This script is written as CommonJS since it should run (convert and test)
// on Node.js versions which don't support ESM

const fs = require('fs');
const path = require('path');
const { rollup, watch } = require('rollup');

const { name: packageName, exports: packageExports } = require('../package.json');
const watchMode = process.argv.includes('--watch');
const treeshake = 'smallest'; // see https://rollupjs.org/guide/en/#treeshake
const patchImportSelf = 'auto'; // 'auto' | false | true
const testFilePattern = /\/__tests\//;
const external = [
    'fs',
    'path',
    'assert',
    'json-to-ast',
    'css-tree',
    'css-tree/tokenizer',
    'css-tree/parser',
    'css-tree/selector-parser',
    'css-tree/generator',
    'css-tree/walker',
    'css-tree/definition-syntax',
    'css-tree/definition-syntax-data',
    'css-tree/definition-syntax-data-patch',
    'css-tree/lexer',
    'css-tree/convertor',
    'css-tree/utils',
    /^source-map/
];

convertAll([{
    entryPoints: [
        './lib/index.js',
        './lib/tokenizer/index.js',
        './lib/parser/index.js',
        './lib/parser/parse-selector.js',
        './lib/generator/index.js',
        './lib/walker/index.js',
        './lib/lexer/index.js',
        './lib/convertor/index.js',
        './lib/utils/index.js',
        ...readDir('./lib/__tests')
    ],
    outputDir: './cjs'
}]);


//
// helpers
//

function readDir(dir, pattern = /\.js$/) {
    return fs.readdirSync(dir)
        .map(fn => `${dir}/${fn}`)
        .filter(fn => fs.statSync(fn).isFile() && pattern.test(fn));
}

function removeCreateRequire() {
    return {
        name: 'remove-createRequire',
        transform(code) {
            return code
                .replace(/import { createRequire } from 'module';\n?/, '')
                .replace(/const require = createRequire\(.+?\);\n?/, '');
        }
    };
}

function patchTests() {
    if (patchImportSelf === false) {
        return;
    }

    // If Node.js doesn't support for `exports` it doesn't support for import/require
    // by package name inside the package itself, so this require() call will fail.
    // We can't use `require(packageName)` here since CJS modules are not generated yet,
    // and Node.js will fail on resolving it disregarding of `exports` support.
    // In this case we need to replace import/require using a package name with
    // a relative path to a module.
    try {
        if (patchImportSelf === 'auto') {
            require(`${packageName}/package.json`);
            return;
        }
    } catch (e) {}

    const resolveMap = new Map([
        [packageName, path.resolve(__dirname, '../lib/index.js')]
    ]);

    for (const [path, resolve] of Object.entries(packageExports)) {
        if (resolve.import) {
            resolveMap.set(path.replace(/^\./, packageName), resolve.import);
        }
    }

    // Make replacement for relative path only for tests since we need to check everything
    // is work on old Node.js version. The rest of code should be unchanged since it will run
    // on any Node.js version.
    console.log(`Fixing CommonJS tests by replacing "${packageName}" for a relative paths`);

    return {
        name: 'cjs-tests-fix',
        transform(code, id) {
            if (testFilePattern.test(id)) {
                return code.replace(
                    new RegExp('from ([\'"])(.+?)\\1;', 'g'),
                    (match, quote, from) => resolveMap.has(from)
                        ? `from '${path.relative(path.dirname(id), resolveMap.get(from))}'`
                        : match
                );
            }
        }
    };
}

async function convert({ entryPoints, outputDir }) {
    const startTime = Date.now();

    console.log();
    console.log(`Convert ESM to CommonJS (output: ${outputDir})`);

    const inputOptions = {
        input: entryPoints,
        external,
        treeshake,
        plugins: [
            removeCreateRequire(),
            patchTests()
        ]
    };
    const outputOptions = {
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
    };

    if (!watchMode) {
        console.log();
        console.log(`Convert ESM to CommonJS (output: ${outputDir})`);

        const bundle = await rollup(inputOptions);
        await bundle.write(outputOptions);
        await bundle.close();

        console.log(`Done in ${Date.now() - startTime}ms`);
    } else {
        const watcher = watch({
            ...inputOptions,
            output: outputOptions
        });

        watcher.on('event', ({ code, duration }) => {
            if (code === 'BUNDLE_END') {
                console.log(`Convert ESM to CommonJS into "${outputDir}" done in ${duration}ms`);
            }
        });
    }
}

async function convertAll(config) {
    for (const entry of config) {
        await convert(entry);
    }
}
