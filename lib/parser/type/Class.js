var FULLSTOP = require('../../tokenizer').TYPE.FullStop;

// '.' ident
module.exports = function Class() {
    var start = this.scanner.tokenStart;
    var name;

    this.scanner.eat(FULLSTOP);
    name = this.readIdent(false);

    return {
        type: 'Class',
        loc: this.getLocation(start, this.scanner.tokenStart),
        name: name
    };
};
