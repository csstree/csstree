var path = require('path');
var fs = require('fs');
var checkUpdatesNeeded = process.argv[2] === '--lint';

fs.readdirSync(path.resolve(__dirname, 'docs')).forEach(function(filename) {
    var name = path.basename(filename);
    var docsFilename = path.resolve(__dirname, '../docs', name.replace(/\.js$/, '.md'));
    var updateFn = require('./docs/' + filename);

    if (!checkUpdatesNeeded) {
        console.log('Synchronizing ' + docsFilename);
    }

    var currentContent = fs.readFileSync(docsFilename, 'utf8').replace(/\r\n/g, '\n');
    var newContent = updateFn(currentContent);

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
