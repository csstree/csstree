var TYPE = require('../../tokenizer').TYPE;

var WHITESPACE = TYPE.WhiteSpace;
var FUNCTION = TYPE.Function;
var URL = TYPE.Url;
var LEFTPARENTHESIS = TYPE.LeftParenthesis;
var RIGHTPARENTHESIS = TYPE.RightParenthesis;
var LEFTCURLYBRACKET = TYPE.LeftCurlyBracket;
var RIGHTCURLYBRACKET = TYPE.RightCurlyBracket;
var LEFTSQUAREBRACKET = TYPE.LeftSquareBracket;
var RIGHTSQUAREBRACKET = TYPE.RightSquareBracket;

module.exports = {
    name: 'Raw',
    structure: {
        value: String
    },
    parse: function(balanced, endTokenType1, endTokenType2) {
        var start = this.scanner.tokenStart;
        var stack = [];
        var popType = 0;
        var type = 0;

        if (balanced) {
            scan:
            for (var i = 0; type = this.scanner.lookupType(i); i++) {
                if (popType === 0) {
                    if (type === endTokenType1 ||
                        type === endTokenType2) {
                        break scan;
                    }
                }

                switch (type) {
                    case popType:
                        popType = stack.pop();
                        break;

                    case RIGHTPARENTHESIS:
                    case RIGHTCURLYBRACKET:
                    case RIGHTSQUAREBRACKET:
                        if (popType === 0) {
                            break scan;
                        }

                        if (!this.tolerant) {
                            this.scanner.skip(i);
                            this.scanner.error();
                        }

                        break;

                    case LEFTPARENTHESIS:
                    case FUNCTION:  // contains parenthesis after name
                    case URL:       // contains parenthesis after name
                        stack.push(popType);
                        popType = RIGHTPARENTHESIS;
                        break;

                    case LEFTCURLYBRACKET:
                        stack.push(popType);
                        popType = RIGHTCURLYBRACKET;
                        break;

                    case LEFTSQUAREBRACKET:
                        stack.push(popType);
                        popType = RIGHTSQUAREBRACKET;
                        break;
                }
            }
        } else {
            // TODO: remove it since this is single exception for url()
            for (var i = 0; type = this.scanner.lookupType(i); i++) {
                if (type === WHITESPACE ||
                    type === LEFTPARENTHESIS ||
                    type === RIGHTPARENTHESIS ||
                    type === FUNCTION ||
                    type === URL) {
                    break;
                }
            }
        }

        this.scanner.skip(i);

        if (popType !== 0 && !this.tolerant) {
            this.scanner.eat(popType);
        }

        return {
            type: 'Raw',
            loc: this.getLocation(start, this.scanner.tokenStart),
            value: this.scanner.substrToCursor(start)
        };
    },
    generate: function(processChunk, node) {
        processChunk(node.value);
    }
};
