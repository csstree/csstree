const cli = require('clap');
const { tokenize } = require('../lib');

cli.command('tokenize', '[css]')
    .action(function(args) {
        const source = args[0] || '';
        const unescaped = JSON.parse(`"${source.replace(/\\.|"/g, m => m === '"' ? '\\"' : m)}"`);

        console.log(tokenize(unescaped).dump());
    })
    .run();
