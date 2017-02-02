var List = require('../../utils/list');
var TYPE = require('../../scanner').TYPE;

var WHITESPACE = TYPE.Whitespace;
var COMMENT = TYPE.Comment;
var IDENTIFIER = TYPE.Identifier;
var LEFTPARENTHESIS = TYPE.LeftParenthesis;
var RIGHTPARENTHESIS = TYPE.RightParenthesis;
var HYPHENMINUS = TYPE.HyphenMinus;
var COLON = TYPE.Colon;
var DISALLOW_VAR = false;
var BALANCED = true;

function readRaw() {
    return new List().appendData(
        this.Raw(BALANCED, 0, 0)
    );
}

function parentheses() {
    var index = 0;

    this.readSC();

    // TODO: make it simplier
    if (this.scanner.tokenType === IDENTIFIER) {
        index = 1;
    } else if (this.scanner.tokenType === HYPHENMINUS) {
        if (this.scanner.lookupType(1) === IDENTIFIER) {
            index = 2;
        } else if (this.scanner.lookupType(1) === HYPHENMINUS &&
                   this.scanner.lookupType(2) === IDENTIFIER) {
            index = 3;
        }
    }

    if (index !== 0 && this.scanner.lookupNonWSType(index) === COLON) {
        return new List().appendData(
            this.Declaration()
        );
    }

    return readSequence.call(this);
}

function readSequence() {
    var children = new List();
    var wasSpace = false;
    var child;

    this.readSC();

    scan:
    while (!this.scanner.eof) {
        switch (this.scanner.tokenType) {
            case WHITESPACE:
                this.scanner.next();
                wasSpace = true;
                continue;

            case COMMENT:
                this.scanner.next();
                continue;

            case IDENTIFIER:
                if (this.scanner.lookupType(1) === LEFTPARENTHESIS) {
                    child = this.Function(this.scopeAtruleExpression, readRaw);
                } else {
                    child = this.Identifier(DISALLOW_VAR);
                }

                break;

            case LEFTPARENTHESIS:
                child = this.Parentheses(parentheses);
                break;

            default:
                break scan;
        }

        if (wasSpace) {
            wasSpace = false;
            children.appendData(this.SPACE_NODE);
        }

        children.appendData(child);
    }

    return children;
}

module.exports = {
    expression: function() {
        var children = readSequence.call(this);

        if (children.isEmpty()) {
            this.scanner.error('Condition is expected');
        }

        return children;
    },
    block: function() {
        return this.Block(this.Rule);
    }
};
