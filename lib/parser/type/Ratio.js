var isNumber = require('../../tokenizer').isNumber;
var TYPE = require('../../tokenizer').TYPE;
var NUMBER = TYPE.Number;
var SOLIDUS = TYPE.Solidus;

function readPositiveInteger(scanner) {
    var value = scanner.consumeNonWS(NUMBER);

    for (var i = 0; i < value.length; i++) {
        if (!isNumber(value.charCodeAt(i))) {
            scanner.error('Positive integer is expected', scanner.tokenStart - value.length + i);
        }
    }

    return value;
}

// <positive-integer> S* '/' S* <positive-integer>
module.exports = function Ratio() {
    var start = this.scanner.tokenStart;
    var left = readPositiveInteger(this.scanner);
    var right;

    this.scanner.eatNonWS(SOLIDUS);
    right = readPositiveInteger(this.scanner);

    return {
        type: 'Ratio',
        loc: this.getLocation(start, this.scanner.tokenStart),
        left: left,
        right: right
    };
};
