var WHITESPACE = require('../../tokenizer').TYPE.Whitespace;
var SPACE = Object.freeze({
    type: 'Space'
});

module.exports = function() {
    this.scanner.eat(WHITESPACE);
    return SPACE;

    // return {
    //     type: 'Space',
    //     loc: this.getLocation(this.scanner.tokenStart, this.scanner.tokenEnd),
    //     value: this.scanner.consume(WHITESPACE)
    // };
};
