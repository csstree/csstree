var TYPE = require('../../tokenizer').TYPE;
var IDENTIFIER = TYPE.Identifier;
var NUMBERSIGN = TYPE.NumberSign;

// '#' ident
module.exports = function Id() {
    this.scanner.eat(NUMBERSIGN);

    return {
        type: 'Id',
        loc: this.getLocation(this.scanner.tokenStart - 1, this.scanner.tokenEnd),
        name: this.scanner.consume(IDENTIFIER)
    };
};
