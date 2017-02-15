var List = require('../utils/list');
var TYPE = require('../tokenizer').TYPE;
var WHITESPACE = TYPE.Whitespace;
var COMMENT = TYPE.Comment;
var ALLOW_OF_CLAUSE = true;
var DISALLOW_OF_CLAUSE = false;

function singleIdentifier() {
    return new List().appendData(
        this.Identifier()
    );
}

function selectorList() {
    return new List().appendData(
        this.SelectorList()
    );
}

function compoundSelector() {
    return new List().appendData(
        this.Selector()
    );
}

function nth() {
    return new List().appendData(
        this.Nth(DISALLOW_OF_CLAUSE)
    );
}

function nthWithOfClause() {
    return new List().appendData(
        this.Nth(ALLOW_OF_CLAUSE)
    );
}

function defaultSequence(recognizer) {
    var children = new List();
    var child = null;
    var context = {
        recognizer: recognizer,
        space: null,
        ignoreWS: false,
        ignoreWSAfter: false
    };

    this.readSC();

    while (!this.scanner.eof) {
        switch (this.scanner.tokenType) {
            case COMMENT:
                this.scanner.next();
                continue;

            case WHITESPACE:
                if (context.ignoreWS) {
                    this.scanner.next();
                } else {
                    context.space = this.WhiteSpace();
                }
                continue;
        }

        child = recognizer.getNode.call(this, context);

        if (child === undefined) {
            break;
        }

        if (context.space !== null) {
            children.appendData(context.space);
            context.space = null;
        }

        children.appendData(child);

        if (context.ignoreWSAfter) {
            context.ignoreWSAfter = false;
            context.ignoreWS = true;
        } else {
            context.ignoreWS = false;
        }
    }

    return children;
}

module.exports = {
    singleIdentifier: singleIdentifier,
    selectorList: selectorList,
    compoundSelector: compoundSelector,
    nth: nth,
    nthWithOfClause: nthWithOfClause,
    default: defaultSequence
};
