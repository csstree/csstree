var List = require('../../utils/list');
var endsWith = require('../../tokenizer').endsWith;
var TYPE = require('../../tokenizer').TYPE;

var WHITESPACE = TYPE.Whitespace;
var IDENTIFIER = TYPE.Identifier;
var COMMENT = TYPE.Comment;
var LEFTPARENTHESIS = TYPE.LeftParenthesis;
var RIGHTPARENTHESIS = TYPE.RightParenthesis;
var FULLSTOP = TYPE.FullStop;
var COLON = TYPE.Colon;

module.exports = function Value(property) {
    // special parser for filter property since it can contains non-standart syntax for old IE
    if (property !== null && endsWith(property, 'filter') && checkProgid.call(this)) {
        return FilterValue.call(this);
    }

    var start = this.scanner.tokenStart;
    var children = this.readSequence(this.scopeValue);

    return {
        type: 'Value',
        loc: this.getLocation(start, this.scanner.tokenStart),
        children: children
    };
};

function FilterValue() {
    var start = this.scanner.tokenStart;
    var children = new List();
    var progid;

    while (progid = checkProgid.call(this)) {
        this.readSC();
        children.appendData(this.Progid(progid));
    }

    this.readSC();

    return {
        type: 'Value',
        loc: this.getLocation(start, this.scanner.tokenStart),
        children: children
    };
}

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
        offset++;
    } else {
        if (this.scanner.lookupValue(offset, 'progid') === false ||
            this.scanner.lookupType(offset + 1) !== COLON) {
            return false; // fail
        }

        offset += 2;
        offset = findNonSCOffset.call(this, offset);

        if (this.scanner.lookupValue(offset + 0, 'dximagetransform') === false ||
            this.scanner.lookupType(offset + 1) !== FULLSTOP ||
            this.scanner.lookupValue(offset + 2, 'microsoft') === false ||
            this.scanner.lookupType(offset + 3) !== FULLSTOP ||
            this.scanner.lookupType(offset + 4) !== IDENTIFIER) {
            return false; // fail
        }

        offset += 5;
        offset = findNonSCOffset.call(this, offset);
    }

    if (this.scanner.lookupType(offset) !== LEFTPARENTHESIS) {
        return false; // fail
    }

    for (var type; type = this.scanner.lookupType(offset); offset++) {
        if (type === RIGHTPARENTHESIS) {
            return offset - startOffset + 1;
        }
    }

    return false;
}
