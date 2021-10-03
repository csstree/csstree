import cli from 'clap';
import { parse, generate } from '../lib/index.js';

cli.command('parse', '[css]')
    .option('-c, --context <context>')
    .option('--no-parse-atrule-prelude')
    .option('--no-parse-rule-prelude')
    .option('--no-parse-value')
    .option('--parse-custom-property')
    .action(function(args) {
        const source = args[0] || '';
        const unescaped = JSON.parse(`"${source.replace(/\\.|"/g, m => m === '"' ? '\\"' : m)}"`);

        console.log(generate(parse(unescaped, this.values)));
    })
    .run();
