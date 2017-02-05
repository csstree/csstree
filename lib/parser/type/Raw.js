var TYPE = require('../../tokenizer').TYPE;

var WHITESPACE = TYPE.Whitespace;
var LEFTPARENTHESIS = TYPE.LeftParenthesis;
var RIGHTPARENTHESIS = TYPE.RightParenthesis;
var LEFTCURLYBRACKET = TYPE.LeftCurlyBracket;
var RIGHTCURLYBRACKET = TYPE.RightCurlyBracket;
var LEFTSQUAREBRACKET = TYPE.LeftSquareBracket;
var RIGHTSQUAREBRACKET = TYPE.RightSquareBracket;

module.exports = function Raw(balanced, endTokenType1, endTokenType2) {
    var start = this.scanner.tokenStart;
    var stack = [];
    var popType = 0;

    if (balanced) {
        scan:
        for (; !this.scanner.eof; this.scanner.next()) {
            if (stack.length === 0) {
                if (this.scanner.tokenType === endTokenType1 ||
                    this.scanner.tokenType === endTokenType2) {
                    if (stack.length === 0) {
                        break scan;
                    }
                }
            }

            switch (this.scanner.tokenType) {
                case popType:
                    if (stack.length === 0) {
                        break scan;
                    }
                    popType = stack.pop();
                    break;

                case RIGHTPARENTHESIS:
                case RIGHTCURLYBRACKET:
                case RIGHTSQUAREBRACKET:
                    if (stack.length !== 0) {
                        this.scanner.error();
                    }
                    break scan;

                case LEFTPARENTHESIS:
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
        for (; !this.scanner.eof; this.scanner.next()) {
            var type = this.scanner.tokenType;

            if (type === WHITESPACE ||
                type === endTokenType1 ||
                type === endTokenType2) {
                break;
            }
        }
    }

    return {
        type: 'Raw',
        loc: this.getLocation(start, this.scanner.tokenStart),
        value: this.scanner.substrToCursor(start)
    };
};
