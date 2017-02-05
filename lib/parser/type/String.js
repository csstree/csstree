var STRING = require('../../tokenizer').TYPE.String;

module.exports = function String() {
    return {
        type: 'String',
        loc: this.getLocation(this.scanner.tokenStart, this.scanner.tokenEnd),
        value: this.scanner.consume(STRING)
    };
};
