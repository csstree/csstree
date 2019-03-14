var TYPE = require('../../tokenizer').TYPE;
var CHARCODE = require('../../tokenizer').CHARCODE;

var WHITESPACE = TYPE.WhiteSpace;
var COMMENT = TYPE.Comment;
var IDENTIFIER = TYPE.Identifier;
var FUNCTION = TYPE.Function;
var COLON = TYPE.Colon;
var LEFTPARENTHESIS = TYPE.LeftParenthesis;
var HYPHENMINUS = CHARCODE.HyphenMinus;

function consumeRaw() {
    return this.createSingleNodeList(
        this.Raw(this.scanner.tokenIndex, 0, 0, false, false)
    );
}

function parentheses() {
    var index = 0;

    this.scanner.skipSC();

    // TODO: make it simplier
    if (this.scanner.tokenType === IDENTIFIER) {
        index = 1;
    } else if (this.scanner.tokenType === HYPHENMINUS &&
               this.scanner.lookupType(1) === IDENTIFIER) {
        index = 2;
    }

    if (index !== 0 && this.lookupNonWSType(index) === COLON) {
        return this.createSingleNodeList(
            this.Declaration()
        );
    }

    return readSequence.call(this);
}

function readSequence() {
    var children = this.createList();
    var space = null;
    var child;

    this.scanner.skipSC();

    scan:
    while (!this.scanner.eof) {
        switch (this.scanner.tokenType) {
            case WHITESPACE:
                space = this.WhiteSpace();
                continue;

            case COMMENT:
                this.scanner.next();
                continue;

            case FUNCTION:
                child = this.Function(consumeRaw, this.scope.AtrulePrelude);
                break;

            case IDENTIFIER:
                child = this.Identifier();
                break;

            case LEFTPARENTHESIS:
                child = this.Parentheses(parentheses, this.scope.AtrulePrelude);
                break;

            default:
                break scan;
        }

        if (space !== null) {
            children.push(space);
            space = null;
        }

        children.push(child);
    }

    return children;
}

module.exports = {
    parse: {
        prelude: function() {
            var children = readSequence.call(this);

            if (this.getFirstListNode(children) === null) {
                this.error('Condition is expected');
            }

            return children;
        },
        block: function() {
            return this.Block(false);
        }
    }
};
