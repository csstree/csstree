var NUMBER = require('../../tokenizer').TYPE.Number;

module.exports = function Number() {
    return {
        type: 'Number',
        loc: this.getLocation(this.scanner.tokenStart, this.scanner.tokenEnd),
        value: this.scanner.consume(NUMBER)
    };
};
