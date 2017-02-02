var TYPE = require('../../scanner').TYPE;

var IDENTIFIER = TYPE.Identifier;
var COLON = TYPE.Colon;

// <pseudo-element> | <pseudo-class>
module.exports = function Pseudo() {
    switch (this.scanner.lookupType(1)) {
        case COLON:
            return this.PseudoElement();

        case IDENTIFIER:
            // '::' starts a pseudo-element, ':' a pseudo-class
            // Exceptions: :first-line, :first-letter, :before and :after
            if (this.scanner.lookupValue(1, 'before') ||
                this.scanner.lookupValue(1, 'after') ||
                this.scanner.lookupValue(1, 'first-letter') ||
                this.scanner.lookupValue(1, 'first-line')) {
                return this.LegacyPseudoElement();
            }
    }

    return this.PseudoClass();
};
