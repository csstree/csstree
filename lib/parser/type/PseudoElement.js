var List = require('../../utils/list');
var TYPE = require('../../scanner').TYPE;

var COLON = TYPE.Colon;
var LEFTPARENTHESIS = TYPE.LeftParenthesis;
var RIGHTPARENTHESIS = TYPE.RightParenthesis;
var ABSOLUTE = false;
var DISALLOW_COMBINATORS = true;

// :: ident
module.exports = function PseudoElement() {
    var start = this.scanner.tokenStart;
    var name;
    var children = null;

    this.scanner.eat(COLON);
    this.scanner.eat(COLON);

    // https://drafts.csswg.org/css-scoping/#slotted-pseudo
    if (this.scanner.lookupValue(0, 'slotted')) {
        name = this.readIdent(false);
        this.scanner.eat(LEFTPARENTHESIS);
        children = new List().appendData(this.Selector(ABSOLUTE, DISALLOW_COMBINATORS));
        this.scanner.eat(RIGHTPARENTHESIS);
    } else {
        name = this.readIdent(false);
    }

    return {
        type: 'PseudoElement',
        loc: this.getLocation(start, this.scanner.tokenStart),
        name: name,
        children: children,
        legacy: false
    };
};
