var List = require('../../utils/list');
var TYPE = require('../../tokenizer').TYPE;

var RIGHTPARENTHESIS = TYPE.RightParenthesis;

// legacy IE function
// expression '(' raw ')'
module.exports = function() {
    return new List().appendData(
        this.Raw(this.scanner.getRawLength(this.scanner.tokenStart, 0, 0, false))
    );
};
