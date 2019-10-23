var TYPE = require('../../tokenizer').TYPE;

var RIGHTPARENTHESIS = TYPE.RightParenthesis;

// <function-token> <sequence> )
module.exports = {
    name: 'Function',
    structure: {
        name: String,
        children: [[]]
    },
    parse: function(readSequence, recognizer) {
        var start = this.tokenStart;
        var name = this.consumeFunctionName();
        var nameLowerCase = name.toLowerCase();
        var children;

        children = recognizer.hasOwnProperty(nameLowerCase)
            ? recognizer[nameLowerCase].call(this, recognizer)
            : readSequence.call(this, recognizer);

        if (!this.eof) {
            this.eat(RIGHTPARENTHESIS);
        }

        return {
            type: 'Function',
            loc: this.getLocation(start, this.tokenStart),
            name: name,
            children: children
        };
    },
    generate: function(node) {
        this.chunk(node.name);
        this.chunk('(');
        this.children(node);
        this.chunk(')');
    },
    walkContext: 'function'
};
