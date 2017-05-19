var List = require('../../utils/list');
var TYPE = require('../../tokenizer').TYPE;

var WHITESPACE = TYPE.WhiteSpace;
var COMMENT = TYPE.Comment;
var SEMICOLON = TYPE.Semicolon;

module.exports = {
    name: 'DeclarationList',
    structure: {
        children: [['Declaration']]
    },
    parse: function() {
        var children = new List();

        scan:
        while (!this.scanner.eof) {
            switch (this.scanner.tokenType) {
                case WHITESPACE:
                case COMMENT:
                case SEMICOLON:
                    this.scanner.next();
                    break;

                default:
                    children.appendData(this.Declaration());
            }
        }

        return {
            type: 'DeclarationList',
            loc: this.getLocationFromList(children),
            children: children
        };
    },
    generate: function(processChunk, node) {
        this.each(processChunk, node.children);
    }
};
