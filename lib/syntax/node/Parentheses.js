import {
    LeftParenthesis,
    RightParenthesis
} from '../../tokenizer/index.js';

export default {
    name: 'Parentheses',
    structure: {
        children: [[]]
    },
    parse: function(readSequence, recognizer) {
        const start = this.tokenStart;
        let children = null;

        this.eat(LeftParenthesis);

        children = readSequence.call(this, recognizer);

        if (!this.eof) {
            this.eat(RightParenthesis);
        }

        return {
            type: 'Parentheses',
            loc: this.getLocation(start, this.tokenStart),
            children
        };
    },
    generate: function(node) {
        this.token(LeftParenthesis, '(');
        this.children(node);
        this.token(RightParenthesis, ')');
    }
};
