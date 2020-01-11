const { Comment } = require('../../tokenizer/types');

const ASTERISK = 0x002A;        // U+002A ASTERISK (*)
const SOLIDUS = 0x002F;         // U+002F SOLIDUS (/)

// '/*' .* '*/'
module.exports = {
    name: 'Comment',
    structure: {
        value: String
    },
    parse: function() {
        const start = this.tokenStart;
        let end = this.tokenEnd;

        this.eat(Comment);

        if ((end - start + 2) >= 2 &&
            this.charCodeAt(end - 2) === ASTERISK &&
            this.charCodeAt(end - 1) === SOLIDUS) {
            end -= 2;
        }

        return {
            type: 'Comment',
            loc: this.getLocation(start, this.tokenStart),
            value: this.substring(start + 2, end)
        };
    },
    generate: function(node) {
        this.chunk('/*');
        this.chunk(node.value);
        this.chunk('*/');
    }
};
