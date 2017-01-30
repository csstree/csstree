var List = require('../../utils/list');
var TYPE = require('../../scanner').TYPE;

var COLON = TYPE.Colon;
var LEFTPARENTHESIS = TYPE.LeftParenthesis;
var RIGHTPARENTESIS = TYPE.RightParenthesis;
var DISALLOW_VAR = false;
var ABSOLUTE = false;
var RELATIVE = true;
var ALLOW_OF_CLAUSE = true;
var DISALLOW_OF_CLAUSE = false;
var BALANCED = true;
var SCOPE_SELECTOR = {
    'lang': getIdentifier,
    'dir': getIdentifier,
    'not': getSelectorList,
    'matches': getSelectorList,
    'has': getRelativeSelectorList,
    'nth-child': getNthWithOfClause,
    'nth-last-child': getNthWithOfClause,
    'nth-of-type': getNth,
    'nth-last-of-type': getNth
};

function getIdentifier() {
    return new List().appendData(
        this.Identifier(DISALLOW_VAR)
    );
}

function getSelectorList() {
    return new List().appendData(
        this.SelectorList(ABSOLUTE)
    );
}

function getRelativeSelectorList() {
    return new List().appendData(
        this.SelectorList(RELATIVE)
    );
}

function getNth() {
    return new List().appendData(
        this.Nth(DISALLOW_OF_CLAUSE)
    );
}

function getNthWithOfClause() {
    return new List().appendData(
        this.Nth(ALLOW_OF_CLAUSE)
    );
}

// : ( ident | function )
module.exports = function PseudoClass() {
    var start = this.scanner.tokenStart;
    var name;
    var children = null;

    this.scanner.eat(COLON);
    name = this.readIdent(DISALLOW_VAR);

    if (this.scanner.tokenType === LEFTPARENTHESIS) {
        var nameLowerCase = name.toLowerCase();

        this.scanner.next();

        if (SCOPE_SELECTOR.hasOwnProperty(nameLowerCase)) {
            children = SCOPE_SELECTOR[nameLowerCase].call(this);
        } else {
            children = new List().appendData(this.Raw(BALANCED, RIGHTPARENTESIS));
        }

        this.scanner.eat(RIGHTPARENTESIS);
    }

    return {
        type: 'PseudoClass',
        loc: this.getLocation(start, this.scanner.tokenStart),
        name: name,
        children: children
    };
};
