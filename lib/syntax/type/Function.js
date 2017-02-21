var TYPE = require('../../tokenizer').TYPE;

var IDENTIFIER = TYPE.Identifier;
var LEFTPARENTHESIS = TYPE.LeftParenthesis;
var RIGHTPARENTHESIS = TYPE.RightParenthesis;

// ident '(' <sequence> ')'
module.exports = {
    name: 'Function',
    parse: function(readSequence, recognizer) {
        var start = this.scanner.tokenStart;
        var name = this.scanner.consume(IDENTIFIER);
        var nameLowerCase = name.toLowerCase();
        var children;

        this.scanner.eat(LEFTPARENTHESIS);

        children = recognizer.hasOwnProperty(nameLowerCase)
            ? recognizer[nameLowerCase].call(this, recognizer)
            : readSequence.call(this, recognizer);

        this.scanner.eat(RIGHTPARENTHESIS);

        return {
            type: 'Function',
            loc: this.getLocation(start, this.scanner.tokenStart),
            name: name,
            children: children
        };
    },
    generate: function(node) {
        return node.name + '(' + this.each(node.children) + ')';
    },
    walk: function(node, context, walk) {
        context['function'] = node;

        node.children.each(walk);

        context['function'] = null;
    }
};
