var COLON = require('../../scanner').TYPE.Colon;

// : ident
// https://drafts.csswg.org/selectors-4/#grammar
// Some older pseudo-elements (::before, ::after, ::first-line, and ::first-letter)
// can, for legacy reasons, be written using the <pseudo-class-selector> grammar,
// with only a single ":" character at their start.
module.exports = function LegacyPseudoElement() {
    var start = this.scanner.tokenStart;
    var name;

    this.scanner.eat(COLON);
    name = this.readIdent(false);

    return {
        type: 'PseudoElement',
        loc: this.getLocation(start, this.scanner.tokenStart),
        name: name,
        children: null,
        legacy: true
    };
};
