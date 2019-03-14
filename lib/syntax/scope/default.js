var cmpChar = require('../../tokenizer').cmpChar;
var TYPE = require('../../tokenizer').TYPE;
var CHARCODE = require('../../tokenizer').CHARCODE;

var IDENTIFIER = TYPE.Identifier;
var STRING = TYPE.String;
var NUMBER = TYPE.Number;
var FUNCTION = TYPE.Function;
var URL = TYPE.Url;
var HASH = TYPE.Hash;
var DIMENSION = TYPE.Dimension;
var PERCENTAGE = TYPE.Percentage;
var LEFTPARENTHESIS = TYPE.LeftParenthesis;
var LEFTSQUAREBRACKET = TYPE.LeftSquareBracket;
var COMMA = TYPE.Comma;
var NUMBERSIGN = CHARCODE.NumberSign;
var PLUSSIGN = CHARCODE.PlusSign;
var HYPHENMINUS = CHARCODE.HyphenMinus;
var SOLIDUS = CHARCODE.Solidus;
var ASTERISK = CHARCODE.Asterisk;
var U = 117; // 'u'.charCodeAt(0)

module.exports = function defaultRecognizer(context) {
    switch (this.scanner.tokenType) {
        case HASH:
        case NUMBERSIGN:
            return this.HexColor();

        case COMMA:
            context.space = null;
            context.ignoreWSAfter = true;
            return this.Operator();

        case SOLIDUS:
        case ASTERISK:
        case PLUSSIGN:
        case HYPHENMINUS:
            return this.Operator();

        case LEFTPARENTHESIS:
            return this.Parentheses(this.readSequence, context.recognizer);

        case LEFTSQUAREBRACKET:
            return this.Brackets(this.readSequence, context.recognizer);

        case STRING:
            return this.String();

        case DIMENSION:
            return this.Dimension();

        case PERCENTAGE:
            return this.Percentage();

        case NUMBER:
            return this.Number();

        case FUNCTION:
            return this.Function(this.readSequence, context.recognizer);

        case URL:
            return this.Url();

        case IDENTIFIER:
            // check for unicode range, it should start with u+ or U+
            if (cmpChar(this.scanner.source, this.scanner.tokenStart, U) &&
                cmpChar(this.scanner.source, this.scanner.tokenStart + 1, PLUSSIGN)) {
                return this.UnicodeRange();
            } else {
                return this.Identifier();
            }
    }
};
