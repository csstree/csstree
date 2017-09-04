var List = require('../../utils/list');
var TYPE = require('../../tokenizer').TYPE;

var WHITESPACE = TYPE.WhiteSpace;
var COMMENT = TYPE.Comment;
var SEMICOLON = TYPE.Semicolon;
var ATRULE = TYPE.Atrule;
var LEFTCURLYBRACKET = TYPE.LeftCurlyBracket;
var RIGHTCURLYBRACKET = TYPE.RightCurlyBracket;

function consumeRaw(startToken) {
    return this.Raw(startToken, 0, SEMICOLON, true, true);
}

module.exports = {
    name: 'Block',
    structure: {
        children: [['Atrule', 'Rule', 'Declaration']]
    },
    parse: function(consumer) {
        if (!consumer) {
            consumer = this.Declaration;
        }

        var start = this.scanner.tokenStart;
        var children;

        this.scanner.eat(LEFTCURLYBRACKET);
        children = this.parseChildren('Block', consumer);
        this.scanner.eat(RIGHTCURLYBRACKET);

        return {
            type: 'Block',
            loc: this.getLocation(start, this.scanner.tokenStart),
            children: children
        };
    },
    parseChildren: function(consumer) {
        var children = new List();

        scan:
        while (!this.scanner.eof) {
            switch (this.scanner.tokenType) {
                case RIGHTCURLYBRACKET:
                    break scan;

                case WHITESPACE:
                case COMMENT:
                case SEMICOLON:
                    this.scanner.next();
                    break;

                case ATRULE:
                    children.appendData(this.tolerantParse(this.Atrule, consumeRaw));
                    break;

                default:
                    children.appendData(this.tolerantParse(consumer, consumeRaw));
            }
        }

        return children;
    },
    generate: function(processChunk, node) {
        processChunk('{');
        this.each(processChunk, node);
        processChunk('}');
    },
    walkContext: 'block'
};
