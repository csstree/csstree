var List = require('../../utils/list');
var TYPE = require('../../tokenizer').TYPE;

var IDENTIFIER = TYPE.Identifier;
var FUNCTION = TYPE.Function;
var COLON = TYPE.Colon;
var RIGHTPARENTHESIS = TYPE.RightParenthesis;
var BALANCED = true;

// :: ident [ '(' .. ')' ]?
module.exports = {
    name: 'PseudoElementSelector',
    structure: {
        name: String,
        children: [['Raw'], null]
    },
    parse: function() {
        var start = this.scanner.tokenStart;
        var children = null;
        var name;

        this.scanner.eat(COLON);
        this.scanner.eat(COLON);

        if (this.scanner.tokenType === FUNCTION) {
            name = this.scanner.consumeFunctionName();
            children = this.parseChildren('PseudoElementSelector', name.toLowerCase());
            this.scanner.eat(RIGHTPARENTHESIS);
        } else {
            name = this.scanner.consume(IDENTIFIER);
        }

        return {
            type: 'PseudoElementSelector',
            loc: this.getLocation(start, this.scanner.tokenStart),
            name: name,
            children: children
        };
    },
    parseChildren: function(name) {
        var children;

        if (this.pseudo.hasOwnProperty(name)) {
            this.scanner.skipSC();
            children = this.pseudo[name].call(this);
            this.scanner.skipSC();
        } else {
            children = new List().appendData(this.Raw(BALANCED, 0, 0));
        }

        return children;
    },
    generate: function(processChunk, node) {
        processChunk('::');
        processChunk(node.name);

        if (node.children !== null) {
            processChunk('(');
            this.each(processChunk, node);
            processChunk(')');
        }
    },
    walkContext: 'function'
};
