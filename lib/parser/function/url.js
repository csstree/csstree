var List = require('../../utils/list');
var TYPE = require('../../tokenizer').TYPE;

var STRING = TYPE.String;
var LEFTPARENTHESIS = TYPE.LeftParenthesis;
var RIGHTPARENTHESIS = TYPE.RightParenthesis;
var NONBALANCED = false;

module.exports = function() {
    var value;

    this.readSC();

    if (this.scanner.tokenType === STRING) {
        value = this.String();
    } else {
        value = this.Raw(NONBALANCED, LEFTPARENTHESIS, RIGHTPARENTHESIS);
    }

    return new List().appendData(
        value
    );
};
