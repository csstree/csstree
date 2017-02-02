var List = require('../../utils/list');

module.exports = function AtruleExpression(name) {
    var start = this.scanner.tokenStart;
    var end = start;
    var children = null;

    // custom consumer
    if (this.atrule.hasOwnProperty(name)) {
        if (typeof this.atrule[name].expression === 'function') {
            children = this.atrule[name].expression.call(this);
            if (children instanceof List === false) {
                return children;
            }
        }
    } else {
        // default consumer
        this.readSC();
        children = this.readAtruleExpression();
    }

    if (children === null || children.isEmpty()) {
        return null;
    }

    if (this.needPositions) {
        end = children.last().loc.end.offset;
    }

    return {
        type: 'AtruleExpression',
        loc: this.getLocation(start, end),
        children: children
    };
};
