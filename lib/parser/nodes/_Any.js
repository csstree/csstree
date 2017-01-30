var TYPE = require('../../scanner').TYPE;

var IDENTIFIER = TYPE.Identifier;
var NUMBER = TYPE.Number;
var PERCENTSIGN = TYPE.PercentSign;
var LEFTPARENTHESIS = TYPE.LeftParenthesis;
var PLUSSIGN = TYPE.PlusSign;
var HYPHENMINUS = TYPE.HyphenMinus;

// any = percentage | dimension | number | operator | ident | function
module.exports = function Any(scope) {
    switch (this.scanner.tokenType) {
        case IDENTIFIER:
            break;

        case HYPHENMINUS:
            var nextType = this.scanner.lookupType(1);
            if (nextType === IDENTIFIER || nextType === HYPHENMINUS) {
                break;
            }
            return this.Operator();

        case PLUSSIGN:
            return this.Operator();

        case NUMBER:
            switch (this.scanner.lookupType(1)) {
                case PERCENTSIGN:
                    return this.Percentage();

                case IDENTIFIER:
                    return this.Dimension();

                default:
                    return this.Number();
            }

        default:
            this.scanner.error();
    }

    var start = this.scanner.tokenStart;

    this.scanIdent(false);

    if (this.scanner.tokenType === LEFTPARENTHESIS) {
        return this.Function(scope, start, this.scanner.substrToCursor(start));
    }

    return {
        type: 'Identifier',
        loc: this.getLocation(start, this.scanner.tokenStart),
        name: this.scanner.substrToCursor(start)
    };
};
