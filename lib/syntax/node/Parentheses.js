var TYPE = require('../../tokenizer').TYPE;
var LEFTPARENTHESIS = TYPE.LeftParenthesis;
var RIGHTPARENTHESIS = TYPE.RightParenthesis;

module.exports = {
    name: 'Parentheses',
    structure: {
        children: [[]]
    },
    parse: function(readSequence, recognizer) {
        var start = this.scanner.tokenStart;
        var children = null;

        this.scanner.eat(LEFTPARENTHESIS);
        children = this.parseChildren('Parentheses', {
            readSequence: readSequence,
            recognizer: recognizer
        });
        this.scanner.eat(RIGHTPARENTHESIS);

        return {
            type: 'Parentheses',
            loc: this.getLocation(start, this.scanner.tokenStart),
            children: children
        };
    },
    parseChildren: function(ctx) { // TODO: !!!
        return ctx.readSequence.call(this, ctx.recognizer);
    },
    generate: function(processChunk, node) {
        processChunk('(');
        this.each(processChunk, node);
        processChunk(')');
    }
};
