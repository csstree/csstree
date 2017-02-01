var List = require('../../utils/list');

module.exports = {
    expression: function() {
        var start = this.scanner.tokenStart;
        var children = new List().appendData(
            this.String()
        );

        return {
            type: 'AtruleExpression',
            loc: this.getLocation(start, this.scanner.tokenStart),
            children: children
        };
    },
    block: false
};
