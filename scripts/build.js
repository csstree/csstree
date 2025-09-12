import esbuild from 'esbuild';
import url from 'url';
import fs from 'fs';
import packageJson from '../package.json' with { type: 'json' };
import path from 'path';
import { lexer } from '../src/index.js';
import { rollup } from 'rollup';

const { version } = packageJson;

const data = JSON.stringify(lexer.dump(), null, 4);

async function bundle() {
    const genModules = {
        'data.js': `export default ${data};`,
        'data.cjs': `module.exports = ${data};`,
        'version.js': `export const version = "${version}";`,
        'version.cjs': `module.exports = "${version}";`
    };
    const genModulesFilter = new RegExp('src[\\\\/](' + Object.keys(genModules).join('|').replace(/\./g, '\\.') + ')$');
    const plugins = [{
        name: 'replace',
        setup({ onLoad }) {
            onLoad({ filter: genModulesFilter }, args => ({
                contents: genModules[path.basename(args.path)]
            }));
        }
    }];

    await Promise.all([
        esbuild.build({
            entryPoints: ['src/index.js'],
            outfile: 'dist/bundled/index.life.js',
            format: 'iife',
            globalName: 'csstree',
            bundle: true,
            minify: true,
            logLevel: 'info',
            plugins
        }),

        esbuild.build({
            entryPoints: ['src/index.js'],
            outfile: 'dist/bundled/index.js',
            format: 'esm',
            bundle: true,
            minify: true,
            logLevel: 'info',
            plugins
        })
    ]);

    for (const [key, value] of Object.entries(genModules)) {
        const fn = path.basename(key);

        fs.writeFileSync(`dist/bundled/${fn}`, value);
    }
}

function readDir(dir, pattern = /\.js$/) {
    return fs.readdirSync(dir)
        .map(fn => `${dir}/${fn}`)
        .filter(fn => fs.statSync(fn).isFile() && pattern.test(fn));
}

const treeshake = 'smallest'; // see https://rollupjs.org/guide/en/#treeshake
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
const entryPoints = [
    './src/index.js',
    './src/tokenizer/index.js',
    './src/parser/index.js',
    './src/parser/parse-selector.js',
    './src/generator/index.js',
    './src/walker/index.js',
    './src/lexer/index.js',
    './src/convertor/index.js',
    './src/utils/index.js',
    ...readDir('./src/__tests')
];

/**
  * The `import ... from ... with type { 'json' }` syntax is not supported by the Node.js versions we still support (<15.0.0)
  * so we simply hoist the JSON into the JavaScript code that imported them with the syntax
  */
function hoistJsonImports() {
    return {
        name: 'hoist-json-imports',
        transform(code, filename) {
            return code
                .replaceAll(
                    /import\s+(\S+)\s+from\s+['"]([^']+)['"]\s+with\s+{\s+type:\s+['"]json['"]\s+}/gm,
                    (_fullImport, specifier, importPath) => {
                        const jsonPath = url.fileURLToPath(import.meta.resolve(importPath, filename));
                        const json = fs.readFileSync(jsonPath, 'utf8'); return `const ${specifier} = ${json.trim()};`;
                    }
                );
        }
    };
}

async function buildCJS() {
    const outputDir = './dist/cjs';

    console.log();
    console.time(`Convert ESM to CJS (output: ${outputDir})`);

    const inputOptions = {
        input: entryPoints,
        external,
        treeshake,
        plugins: [
            hoistJsonImports()
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

    const build = await rollup(inputOptions);
    await build.write(outputOptions);
    await build.close();

    console.timeEnd(`Convert ESM to CJS (output: ${outputDir})`);
}

async function buildESM() {
    const outputDir = './dist/esm';

    console.log();
    console.time(`Building ESM (output: ${outputDir})`);

    const inputOptions = {
        input: entryPoints,
        external,
        treeshake,
        plugins: [
            hoistJsonImports()
        ]
    };
    const outputOptions = {
        dir: outputDir,
        entryFileNames: '[name].js',
        format: 'esm',
        exports: 'auto',
        preserveModules: true,
        interop: false,
        esModule: true,
        generatedCode: {
            constBindings: true
        }
    };

    const build = await rollup(inputOptions);
    await build.write(outputOptions);
    await build.close();

    console.timeEnd(`Building ESM (output: ${outputDir})`);
}

bundle();
buildCJS();
buildESM();
