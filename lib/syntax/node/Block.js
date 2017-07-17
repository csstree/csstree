var List = require('../../utils/list');
var TYPE = require('../../tokenizer').TYPE;

var WHITESPACE = TYPE.WhiteSpace;
var COMMENT = TYPE.Comment;
var SEMICOLON = TYPE.Semicolon;
var COMMERCIALAT = TYPE.CommercialAt;
var LEFTCURLYBRACKET = TYPE.LeftCurlyBracket;
var RIGHTCURLYBRACKET = TYPE.RightCurlyBracket;
var NONBALANCED = false;
var EOF = 0;

function parseFallback(start) {
    var type = 0;

    scan:
    for (var i = 0; type = this.scanner.lookupType(i); i++) {
        switch (type) {
            case SEMICOLON:
                i++;
                break scan;
            case RIGHTCURLYBRACKET:
            case EOF:
                break scan;
        }
    }

    this.scanner.skip(i);

    return {
        type: 'Raw',
        loc: this.getLocation(start, this.scanner.tokenStart),
        value: this.scanner.substrToCursor(start)
    };
}

module.exports = {
    name: 'Block',
    structure: {
        children: [['Atrule', 'Rule', 'Declaration']]
    },
    parse: function(defaultConsumer) {
        if (!defaultConsumer) {
            defaultConsumer = this.Declaration;
        }

        var start = this.scanner.tokenStart;
        var children = new List();

        this.scanner.eat(LEFTCURLYBRACKET);

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

                case COMMERCIALAT:
                    children.appendData(this.read(this.Atrule, parseFallback));
                    break;

                default:
                    children.appendData(this.read(defaultConsumer, parseFallback));
            }
        }

        this.scanner.eat(RIGHTCURLYBRACKET);

        return {
            type: 'Block',
            loc: this.getLocation(start, this.scanner.tokenStart),
            children: children
        };
    },
    generate: function(processChunk, node) {
        processChunk('{');
        this.each(processChunk, node);
        processChunk('}');
    },
    walkContext: 'block'
};
