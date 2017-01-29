var PERCENTSIGN = require('../../scanner').TYPE.PercentSign;

module.exports = function Percentage() {
    var start = this.scanner.tokenStart;
    var number = this.readNumber();

    this.scanner.eat(PERCENTSIGN);

    return {
        type: 'Percentage',
        loc: this.getLocation(start, this.scanner.tokenStart),
        value: number
    };
};
