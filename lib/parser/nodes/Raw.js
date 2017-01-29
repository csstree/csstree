var TYPE = require('../../scanner').TYPE;

var WHITESPACE = TYPE.WhiteSpace;
var LEFTPARENTHESIS = TYPE.LeftParenthesis;
var RIGHTPARENTHESIS = TYPE.RightParenthesis;
var LEFTCURLYBRACKET = TYPE.LeftCurlyBracket;
var RIGHTCURLYBRACKET = TYPE.RightCurlyBracket;
var LEFTSQUAREBRACKET = TYPE.LeftSquareBracket;
var RIGHTSQUAREBRACKET = TYPE.RightSquareBracket;

module.exports = function Raw(balanced, endTokenType) {
    var start = this.scanner.tokenStart;
    var stack = [];
    var popType = endTokenType || 0;

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
                    this.scanner.error();
                    break;

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
