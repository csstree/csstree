var List = require('../../utils/list');

module.exports = function AtruleExpression(name) {
    var children = null;

    if (name !== null) {
        name = name.toLowerCase();
    }

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
        children = this.readSequence(this.scopeAtruleExpression);
    }

    if (children === null || children.isEmpty()) {
        return null;
    }

    return {
        type: 'AtruleExpression',
        loc: this.getLocationFromList(children),
        children: children
    };
};
