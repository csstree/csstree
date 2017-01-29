var List = require('../../utils/list');
var COMMA = require('../../scanner').TYPE.Comma;
var ALLOWED_VAR = true;
var NESTED = true;

// var '(' ident (',' <declaration-value>)? ')'
function getVarFunctionArguments() {
    var children = new List();

    this.readSC();
    children.appendData(this.Identifier(ALLOWED_VAR));
    this.readSC();

    if (this.scanner.tokenType === COMMA) {
        children.appendData(this.Operator());

        this.readSC();
        children.appendData(this.Value(NESTED, null));
        this.readSC();
    }

    return children;
}

module.exports = function getVarFunction(scope, start, name, getFunctionInternal) {
    return getFunctionInternal.call(this, getVarFunctionArguments, scope, start, name);
};
