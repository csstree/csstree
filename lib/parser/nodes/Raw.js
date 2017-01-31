var TYPE = require('../../scanner').TYPE;

var WHITESPACE = TYPE.WhiteSpace;
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
            switch (this.scanner.tokenType) {
                case popType:
                    if (stack.length === 0) {
                        break scan;
                    }
                    popType = stack.pop();
                    break;

                case WHITESPACE:
                    if (stack.length !== 0) {
                        continue;
                    } else {
                        break scan;
                    }

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

                case endTokenType1:
                case endTokenType2:
                    if (stack.length === 0) {
                        break scan;
                    }
                    break;
            }
        }
    } else {
        for (; !this.scanner.eof; this.scanner.next()) {
            var type = this.scanner.tokenType;

            if (type === WHITESPACE ||
                type === LEFTPARENTHESIS ||
                type === RIGHTPARENTHESIS) {
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
