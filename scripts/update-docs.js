const path = require('path');
const fs = require('fs');
const checkUpdatesNeeded = process.argv[2] === '--lint';

fs.readdirSync(path.resolve(__dirname, 'docs')).forEach(function(filename) {
    const name = path.basename(filename);
    const docsFilename = path.resolve(__dirname, '../docs', name.replace(/\.js$/, '.md'));
    const updateFn = require('./docs/' + filename);

    if (!checkUpdatesNeeded) {
        console.log('Synchronizing ' + docsFilename);
    }

    const currentContent = fs.readFileSync(docsFilename, 'utf8').replace(/\r\n/g, '\n');
    const newContent = updateFn(currentContent);

    if (typeof newContent === 'string' && newContent !== currentContent) {
        if (checkUpdatesNeeded) {
            console.error('File ' + docsFilename + ' requires to be up to date.\nRun `npm run update:docs` to fix the problem');
            process.exit(2);
        }

        fs.writeFileSync(docsFilename, newContent, 'utf8');
        console.log('  Updated');
    } else {
        if (!checkUpdatesNeeded) {
            console.log('  No updates');
        }
    }
});
