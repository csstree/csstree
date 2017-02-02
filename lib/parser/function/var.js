var List = require('../../utils/list');
var TYPE = require('../../scanner').TYPE;

var COMMA = TYPE.Comma;
var HYPHENMINUS = TYPE.HyphenMinus;
var EXCLAMATIONMARK = TYPE.ExclamationMark;
var ALLOWED_VAR = true;
var BALANCED = true;

// var '(' ident (',' <value>? )? ')'
module.exports = function getVarFunction() {
    var children = new List();

    this.readSC();

    if (this.scanner.tokenType !== HYPHENMINUS) {
        this.scanner.error('Hyphen minus is expected');
    }
    if (this.scanner.lookupType(1) !== HYPHENMINUS) {
        this.scanner.error('Hyphen minus is expected', this.scanner.tokenStart + 1);
    }

    children.appendData(this.Identifier(ALLOWED_VAR));

    this.readSC();

    if (this.scanner.tokenType === COMMA) {
        children.appendData(this.Operator());
        children.appendData(this.Raw(BALANCED, HYPHENMINUS, EXCLAMATIONMARK));
    }

    return children;
};
