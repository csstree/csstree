var List = require('../../utils/list');
var TYPE = require('../../scanner').TYPE;
var DESCENDANT_COMBINATOR = {};

var WHITESPACE = TYPE.Whitespace;
var IDENTIFIER = TYPE.Identifier;
var NUMBER = TYPE.Number;
var COMMENT = TYPE.Comment;
var NUMBERSIGN = TYPE.NumberSign;
var ASTERISK = TYPE.Asterisk;
var PLUSSIGN = TYPE.PlusSign;
var FULLSTOP = TYPE.FullStop;
var SOLIDUS = TYPE.Solidus;
var COLON = TYPE.Colon;
var GREATERTHANSIGN = TYPE.GreaterThanSign;
var LEFTSQUAREBRACKET = TYPE.LeftSquareBracket;
var VERTICALLINE = TYPE.VerticalLine;
var TILDE = TYPE.Tilde;

module.exports = function Selector(relative, disallowCombinators) {
    this.readSC();

    var start = this.scanner.tokenStart;
    var end = start;
    var children = new List();
    var combinator = null;
    var combinatorOffset = -1;
    var child = null;

    relative = relative || false;
    disallowCombinators = disallowCombinators || false;

    scan:
    while (!this.scanner.eof) {
        switch (this.scanner.tokenType) {
            case COMMENT:
                if (disallowCombinators) {
                    this.readSC();
                    break scan;
                }

                this.scanner.next();
                continue;

            case WHITESPACE:
                if (disallowCombinators) {
                    this.readSC();
                    break scan;
                }

                if (combinator === null && children.head !== null) {
                    combinatorOffset = this.scanner.tokenStart;
                    combinator = DESCENDANT_COMBINATOR;
                } else {
                    this.scanner.next();
                }
                continue;

            case PLUSSIGN:
            case GREATERTHANSIGN:
            case TILDE:
            case SOLIDUS:
                if (disallowCombinators ||
                    (children.head === null && !relative) || // combinator in the beginning
                    (combinator !== null && combinator !== DESCENDANT_COMBINATOR)) {
                    this.scanner.error('Unexpected combinator');
                }

                combinatorOffset = this.scanner.tokenStart;
                combinator = this.Combinator();
                continue;

            case FULLSTOP:
                child = this.Class();
                break;

            case LEFTSQUAREBRACKET:
                child = this.Attribute();
                break;

            case NUMBERSIGN:
                child = this.Id();
                break;

            case COLON:
                child = this.Pseudo();
                break;

            case IDENTIFIER:
            case ASTERISK:
            case VERTICALLINE:
                var idx =
                    this.scanner.tokenType === VERTICALLINE ? 1 :
                    this.scanner.lookupType(1) === VERTICALLINE ? 2 :
                    0;

                switch (this.scanner.lookupType(idx)) {
                    case IDENTIFIER:
                        child = this.Type();
                        break;

                    case ASTERISK:
                        child = this.Universal();
                        break;

                    default:
                        this.scanner.skip(idx);
                        this.scanner.error('Identifier or asterisk is expected');
                }
                break;

            case NUMBER:
                child = this.Percentage();
                break;

            default:
                break scan;
        }

        if (combinator !== null) {
            // create descendant combinator on demand to avoid garbage
            if (combinator === DESCENDANT_COMBINATOR) {
                combinator = {
                    type: 'Combinator',
                    loc: this.getLocation(combinatorOffset, combinatorOffset + 1),
                    name: ' '
                };
            }

            children.appendData(combinator);
            combinator = null;
        }

        children.appendData(child);
        end = this.scanner.tokenStart;
    }

    // nothing were consumed
    if (child === null) {
        this.scanner.error('Selector is expected');
    }

    if (combinator !== null && combinator !== DESCENDANT_COMBINATOR) {
        this.scanner.error('Unexpected combinator', combinatorOffset);
    }

    return {
        type: 'Selector',
        loc: this.getLocation(start, end),
        children: children
    };
};
