var TYPE = require('../../tokenizer').TYPE;

var LEFTSQUAREBRACKET = TYPE.LeftSquareBracket;
var RIGHTSQUAREBRACKET = TYPE.RightSquareBracket;

module.exports = {
    name: 'Brackets',
    structure: {
        children: [[]]
    },
    parse: function(readSequence, recognizer) {
        var start = this.tokenStart;
        var children = null;

        this.eat(LEFTSQUAREBRACKET);

        children = readSequence.call(this, recognizer);

        if (!this.eof) {
            this.eat(RIGHTSQUAREBRACKET);
        }

        return {
            type: 'Brackets',
            loc: this.getLocation(start, this.tokenStart),
            children: children
        };
    },
    generate: function(node) {
        this.chunk('[');
        this.children(node);
        this.chunk(']');
    }
};
