var TYPE = require('../../tokenizer').TYPE;
var RIGHTPARENTHESIS = TYPE.RightParenthesis;

// <function-token> <sequence> ')'
module.exports = {
    name: 'Function',
    structure: {
        name: String,
        children: [[]]
    },
    parse: function(recognizer, parseChildren) {
        var start = this.scanner.tokenStart;
        var name = this.scanner.consumeFunctionName();
        var lowerCaseName = name.toLowerCase();
        var children;

        if (typeof parseChildren === 'function') {
            children = parseChildren.call(this, recognizer);
        } else {
            children = recognizer.hasOwnProperty(lowerCaseName)
                ? recognizer[lowerCaseName].call(this, recognizer)
                : this.parseChildren('Function', recognizer);
        }

        this.scanner.eat(RIGHTPARENTHESIS);

        return {
            type: 'Function',
            loc: this.getLocation(start, this.scanner.tokenStart),
            name: name,
            children: children
        };
    },
    parseChildren: function(recognizer) {
        return this.readSequence(recognizer);
    },
    generate: function(processChunk, node) {
        processChunk(node.name);
        processChunk('(');
        this.each(processChunk, node);
        processChunk(')');
    },
    walkContext: 'function'
};
