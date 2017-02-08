var WHITESPACE = require('../../tokenizer').TYPE.Whitespace;
var SPACE = Object.freeze({
    type: 'WhiteSpace',
    loc: null,
    value: ' '
});

module.exports = function WhiteSpace() {
    this.scanner.eat(WHITESPACE);
    return SPACE;

    // return {
    //     type: 'WhiteSpace',
    //     loc: this.getLocation(this.scanner.tokenStart, this.scanner.tokenEnd),
    //     value: this.scanner.consume(WHITESPACE)
    // };
};
