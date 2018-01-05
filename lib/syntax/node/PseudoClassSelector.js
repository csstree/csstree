var List = require('../../utils/list');
var TYPE = require('../../tokenizer').TYPE;

var IDENTIFIER = TYPE.Identifier;
var FUNCTION = TYPE.Function;
var COLON = TYPE.Colon;
var RIGHTPARENTHESIS = TYPE.RightParenthesis;

// : ident [ '(' .. ')' ]?
module.exports = {
    name: 'PseudoClassSelector',
    walkContext: 'function',
    structure: {
        name: String,
        children: [['Raw'], null]
    },
    parse: function() {
        var start = this.scanner.tokenStart;
        var children = null;
        var name;
        var nameLowerCase;

        this.scanner.eat(COLON);

        if (this.scanner.tokenType === FUNCTION) {
            name = this.scanner.consumeFunctionName();
            nameLowerCase = name.toLowerCase();

            if (this.pseudo.hasOwnProperty(nameLowerCase)) {
                this.scanner.skipSC();
                children = this.pseudo[nameLowerCase].call(this);
                this.scanner.skipSC();
            } else {
                children = new List();
                children.push(
                    this.Raw(this.scanner.currentToken, 0, 0, false, false)
                );
            }

            this.scanner.eat(RIGHTPARENTHESIS);
        } else {
            name = this.scanner.consume(IDENTIFIER);
        }

        return {
            type: 'PseudoClassSelector',
            loc: this.getLocation(start, this.scanner.tokenStart),
            name: name,
            children: children
        };
    },
    generate: function(node) {
        this.chunk(':');
        this.chunk(node.name);

        if (node.children !== null) {
            this.chunk('(');
            this.children(node);
            this.chunk(')');
        }
    },
    validate: function(node, warn) {
        var name = node.name.toLowerCase();
        if (!Object.prototype.hasOwnProperty.call(this.defs.PseudoClassSelector, name)) {
            warn(node, new SyntaxError('Unknown pseudo class `:' + node.name + '`'));
        } else {
            var settings = this.defs.PseudoClassSelector[name];

            if (node.children) {
                if ((settings & 2) === 0) {
                    warn(node, new SyntaxError('Pseudo class `:' + node.name + '` should not has a parameters'));
                }
            } else {
                if ((settings & 1) === 0) {
                    warn(node, new SyntaxError('Pseudo class `:' + node.name + '()` should has a parameters'));
                }
            }
        }
    }
};
