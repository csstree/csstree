var List = require('../../utils/list');
var RIGHTPARENTHESIS = require('../../scanner').TYPE.RightParenthesis;
var BALANCED = true;

// legacy IE function
// expression '(' raw ')'
function getExpressionArguments() {
    return new List().appendData(
        this.Raw(BALANCED, RIGHTPARENTHESIS)
    );
};

module.exports = function getOldIEExpression(scope, start, name, getFunctionInternal) {
    return getFunctionInternal.call(this, getExpressionArguments, scope, start, name);
};
