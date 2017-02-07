var List = require('../../utils/list');
var TYPE = require('../../tokenizer').TYPE;

var IDENTIFIER = TYPE.Identifier;
var COLON = TYPE.Colon;
var LEFTPARENTHESIS = TYPE.LeftParenthesis;
var RIGHTPARENTHESIS = TYPE.RightParenthesis;
var BALANCED = true;

// :: ident [ '(' .. ')' ]?
module.exports = function PseudoElementSelector() {
    var start = this.scanner.tokenStart;
    var name;
    var children = null;

    this.scanner.eat(COLON);
    this.scanner.eat(COLON);

    name = this.scanner.consume(IDENTIFIER);

    if (this.scanner.tokenType === LEFTPARENTHESIS) {
        var nameLowerCase = name.toLowerCase();

        this.scanner.next();

        if (this.pseudo.hasOwnProperty(nameLowerCase)) {
            this.readSC();
            children = this.pseudo[nameLowerCase].call(this);
            this.readSC();
        } else {
            children = new List().appendData(this.Raw(BALANCED, 0, 0));
        }

        this.scanner.eat(RIGHTPARENTHESIS);
    }

    return {
        type: 'PseudoElementSelector',
        loc: this.getLocation(start, this.scanner.tokenStart),
        name: name,
        children: children
    };
};
