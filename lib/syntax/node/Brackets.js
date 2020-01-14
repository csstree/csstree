const {
    Delim,
    LeftSquareBracket,
    RightSquareBracket
} = require('../../tokenizer/types');

module.exports = {
    name: 'Brackets',
    structure: {
        children: [[]]
    },
    parse: function(readSequence, recognizer) {
        const start = this.tokenStart;
        let children = null;

        this.eat(LeftSquareBracket);

        children = readSequence.call(this, recognizer);

        if (!this.eof) {
            this.eat(RightSquareBracket);
        }

        return {
            type: 'Brackets',
            loc: this.getLocation(start, this.tokenStart),
            children
        };
    },
    generate: function(node) {
        this.token(Delim, '[');
        this.children(node);
        this.token(Delim, ']');
    }
};
