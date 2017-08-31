var TYPE = require('../../tokenizer').TYPE;
var RIGHTPARENTHESIS = TYPE.RightParenthesis;

// <function-token> <sequence> ')'
module.exports = {
    name: 'Function',
    structure: {
        name: String,
        children: [[]]
    },
    parse: function(readSequence, recognizer) {
        var start = this.scanner.tokenStart;
        var name = this.scanner.consumeFunctionName();
        var children = this.parseChildren('Function', {
            name: name.toLowerCase(),
            readSequence: readSequence,
            recognizer: recognizer
        });

        this.scanner.eat(RIGHTPARENTHESIS);

        return {
            type: 'Function',
            loc: this.getLocation(start, this.scanner.tokenStart),
            name: name,
            children: children
        };
    },
    parseChildren: function(ctx) { // TODO: !!!
        return ctx.recognizer.hasOwnProperty(ctx.name)
            ? ctx.recognizer[ctx.name].call(this, ctx.recognizer)
            : ctx.readSequence.call(this, ctx.recognizer);
    },
    generate: function(processChunk, node) {
        processChunk(node.name);
        processChunk('(');
        this.each(processChunk, node);
        processChunk(')');
    },
    walkContext: 'function'
};
