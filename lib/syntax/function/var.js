const { Comma } = require('../../tokenizer/types');
const rawMode = require('../node/Raw').mode;

// var( <ident> , <value>? )
module.exports = function() {
    const children = this.createList();

    this.skipSC();

    // NOTE: Don't check more than a first argument is an ident, rest checks are for lexer
    children.push(this.Identifier());

    this.skipSC();

    if (this.tokenType === Comma) {
        children.push(this.Operator());
        children.push(this.parseCustomProperty
            ? this.Value(null)
            : this.Raw(this.tokenIndex, rawMode.exclamationMarkOrSemicolon, false)
        );
    }

    return children;
};
