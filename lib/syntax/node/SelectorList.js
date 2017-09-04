var List = require('../../utils/list');
var TYPE = require('../../tokenizer').TYPE;

var COMMA = TYPE.Comma;
var LEFTCURLYBRACKET = TYPE.LeftCurlyBracket;

module.exports = {
    name: 'SelectorList',
    structure: {
        children: [['Selector', 'Raw']]
    },
    parse: function() {
        var children = this.parseChildren('SelectorList');

        return {
            type: 'SelectorList',
            loc: this.getLocationFromList(children),
            children: children
        };
    },
    parseChildren: function() {
        var children = new List();

        while (!this.scanner.eof) {
            children.appendData(this.parseSelector
                ? this.Selector()
                : this.Raw(this.scanner.currentToken, COMMA, LEFTCURLYBRACKET, false, false)
            );

            if (this.scanner.tokenType !== COMMA) {
                break;
            }

            this.scanner.next();
        }

        return children;
    },
    generate: function(processChunk, node) {
        this.eachComma(processChunk, node);
    },
    walkContext: 'selector'
};
