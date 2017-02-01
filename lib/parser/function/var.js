var List = require('../../utils/list');
var TYPE = require('../../scanner').TYPE;

var COMMA = TYPE.Comma;
var HYPHENMINUS = TYPE.HyphenMinus;
var EXCLAMATIONMARK = TYPE.ExclamationMark;
var ALLOWED_VAR = true;
var BALANCED = true;

// var '(' ident (',' <declaration-value>)? ')'
function getVarFunctionArguments() {
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
}

module.exports = function getVarFunction(scope, start, name, getFunctionInternal) {
    return getFunctionInternal.call(this, getVarFunctionArguments, scope, start, name);
};
