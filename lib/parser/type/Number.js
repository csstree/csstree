var NUMBER = require('../../scanner').TYPE.Number;

module.exports = function Number() {
    var start = this.scanner.tokenStart;

    this.scanner.eat(NUMBER);

    return {
        type: 'Number',
        loc: this.getLocation(start, this.scanner.tokenStart),
        value: this.scanner.substrToCursor(start)
    };
};
