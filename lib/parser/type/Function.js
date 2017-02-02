var List = require('../../utils/list');
var TYPE = require('../../scanner').TYPE;

var LEFTPARENTHESIS = TYPE.LeftParenthesis;
var RIGHTPARENTHESIS = TYPE.RightParenthesis;
var DISALLOW_VAR = false;

// ident '(' <sequence> ')'
module.exports = function Function(scope, readSequence) {
    var start = this.scanner.tokenStart;
    var name = this.readIdent(DISALLOW_VAR);
    var nameLowerCase = name.toLowerCase();
    var children;

    this.scanner.eat(LEFTPARENTHESIS);

    if (scope.hasOwnProperty(nameLowerCase)) {
        children = scope[nameLowerCase].call(this, scope, start, readSequence);

        if (children instanceof List === false) {
            return children;
        }
    } else {
        children = readSequence.call(this, scope);
    }

    this.scanner.eat(RIGHTPARENTHESIS);

    return {
        type: 'Function',
        loc: this.getLocation(start, this.scanner.tokenStart),
        name: name,
        children: children
    };
};
