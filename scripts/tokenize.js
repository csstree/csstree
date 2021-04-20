import cli from 'clap';
import { tokenize, TokenStream } from '../lib/index.js';

cli.command('tokenize', '[css]')
    .action(function(args) {
        const source = args[0] || '';
        const unescaped = JSON.parse(`"${source.replace(/\\.|"/g, m => m === '"' ? '\\"' : m)}"`);
        const tokenStream = new TokenStream(unescaped, tokenize);

        console.log(tokenStream.dump());
    })
    .run();
