var NUMBERSIGN = require('../../scanner').TYPE.NumberSign;

// '#' ident
module.exports = function Id() {
    var start = this.scanner.tokenStart;
    var name;

    this.scanner.eat(NUMBERSIGN);
    name = this.readIdent(false);

    return {
        type: 'Id',
        loc: this.getLocation(start, this.scanner.tokenStart),
        name: name
    };
};
