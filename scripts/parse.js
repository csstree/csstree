import cli from 'clap';
import { parse, toPlainObject } from '../lib/index.js';

cli.command('parse', '[css]')
    .option('-c, --context <context>')
    .option('--offset <number>')
    .option('--line <number>')
    .option('--column <number>')
    .option('--filename <string>')
    .option('-p, --positions')
    .option('--no-parse-atrule-prelude')
    .option('--no-parse-rule-prelude')
    .option('--no-parse-value')
    .option('--parse-custom-property')
    .action(function(args) {
        const source = args[0] || '';
        const unescaped = JSON.parse(`"${source.replace(/\\.|"/g, m => m === '"' ? '\\"' : m)}"`);

        console.dir(toPlainObject(parse(unescaped, this.values)), { depth: null });
    })
    .run();
