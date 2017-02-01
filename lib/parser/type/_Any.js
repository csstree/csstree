var TYPE = require('../../scanner').TYPE;

var IDENTIFIER = TYPE.Identifier;
var NUMBER = TYPE.Number;
var PERCENTSIGN = TYPE.PercentSign;
var LEFTPARENTHESIS = TYPE.LeftParenthesis;
var PLUSSIGN = TYPE.PlusSign;
var HYPHENMINUS = TYPE.HyphenMinus;
var DISALLOW_VAR = false;

// any = percentage | dimension | number | operator | ident | function
module.exports = function Any(scope) {
    switch (this.scanner.tokenType) {
        case IDENTIFIER:
            if (this.scanner.lookupType(1) === LEFTPARENTHESIS) {
                return this.Function(scope);
            }

            return this.Identifier(DISALLOW_VAR);

        case HYPHENMINUS:
            if (this.scanner.lookupType(1) === IDENTIFIER) {
                if (this.scanner.lookupType(2) === LEFTPARENTHESIS) {
                    return this.Function(scope);
                }

                return this.Identifier(DISALLOW_VAR);
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
};
