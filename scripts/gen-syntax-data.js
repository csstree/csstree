var defaultFilename = require('path').resolve(__dirname + '/../dist/default-syntax.js');
var defaultSyntax = require('../lib').lexer;

module.exports = function writeFile(filename = defaultFilename) {
    console.log('Write default syntax data to ' + filename);
    require('fs').writeFileSync(
        filename,
        'module.exports = ' + String(defaultSyntax)
    );
};

if (require.main === module) {
    module.exports();
}
