var endsWith = require('../../tokenizer').endsWith;
var TYPE = require('../../tokenizer').TYPE;

var WHITESPACE = TYPE.Whitespace;
var COMMENT = TYPE.Comment;
var LEFTPARENTHESIS = TYPE.LeftParenthesis;
var COLON = TYPE.Colon;
var SEMICOLON = TYPE.Semicolon;
var EXCLAMATIONMARK = TYPE.ExclamationMark;
var BALANCED = true;

module.exports = function Value(property) {
    // special parser for filter property since it can contains non-standart syntax for old IE
    if (property !== null && endsWith(property, 'filter') && checkProgid.call(this)) {
        this.readSC();
        return this.Raw(BALANCED, SEMICOLON, EXCLAMATIONMARK);
    }

    var start = this.scanner.tokenStart;
    var children = this.readSequence(this.scopeValue);

    return {
        type: 'Value',
        loc: this.getLocation(start, this.scanner.tokenStart),
        children: children
    };
};

function findNonSCOffset(offset) {
    for (var type; type = this.scanner.lookupType(offset); offset++) {
        if (type !== WHITESPACE && type !== COMMENT) {
            break;
        }
    }

    return offset;
}

// 'progid:' ws* 'DXImageTransform.Microsoft.' ident ws* '(' .* ')'
function checkProgid() {
    var startOffset = findNonSCOffset.call(this, 0);
    var offset = startOffset;

    if (this.scanner.lookupValue(offset, 'alpha') ||
        this.scanner.lookupValue(offset, 'dropshadow')) {
        if (this.scanner.lookupType(offset + 1) !== LEFTPARENTHESIS) {
            return false; // fail
        }
    } else {
        if (this.scanner.lookupValue(offset, 'progid') === false ||
            this.scanner.lookupType(offset + 1) !== COLON) {
            return false; // fail
        }
    }

    return true;
}
