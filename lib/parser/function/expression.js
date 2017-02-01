var List = require('../../utils/list');
var BALANCED = true;

// legacy IE function
// expression '(' raw ')'
function getExpressionArguments() {
    return new List().appendData(
        this.Raw(BALANCED, 0, 0)
    );
};

module.exports = function getOldIEExpression(scope, start, name, getFunctionInternal) {
    return getFunctionInternal.call(this, getExpressionArguments, scope, start, name);
};
