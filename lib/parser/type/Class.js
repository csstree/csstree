var TYPE = require('../../tokenizer').TYPE;
var IDENTIFIER = TYPE.Identifier;
var FULLSTOP = TYPE.FullStop;

// '.' ident
module.exports = function Class() {
    this.scanner.eat(FULLSTOP);

    return {
        type: 'Class',
        loc: this.getLocation(this.scanner.tokenStart - 1, this.scanner.tokenEnd),
        name: this.scanner.consume(IDENTIFIER)
    };
};
