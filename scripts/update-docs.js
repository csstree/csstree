var path = require('path');
var fs = require('fs');

fs.readdirSync(path.resolve(__dirname, 'docs')).forEach(function(filename) {
    var name = path.basename(filename);
    var docsFilename = path.resolve(__dirname, '../docs', name.replace(/\.js$/, '.md'));
    var updateFn = require('./docs/' + filename);

    console.log('Update ' + docsFilename);
    var currentContent = fs.readFileSync(docsFilename, 'utf8').replace(/\r\n/g, '\n');
    var newContent = updateFn(currentContent);

    if (typeof newContent === 'string' && newContent !== currentContent) {
        fs.writeFileSync(docsFilename, newContent, 'utf8');
        console.log('  Updated');
    } else {
        console.log('  No update');
    }
});
