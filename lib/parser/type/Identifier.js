var TYPE = require('../../tokenizer').TYPE;
var IDENTIFIER = TYPE.Identifier;

module.exports = function Identifier() {
    return {
        type: 'Identifier',
        loc: this.getLocation(this.scanner.tokenStart, this.scanner.tokenEnd),
        name: this.scanner.consume(IDENTIFIER)
    };
};
