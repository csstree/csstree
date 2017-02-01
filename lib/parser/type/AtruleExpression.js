module.exports = function AtruleExpression(name) {
    // custom consumer
    if (this.atrule.hasOwnProperty(name)) {
        if (typeof this.atrule[name].expression === 'function') {
            return this.atrule[name].expression.call(this);
        } else {
            return null;
        }
    }

    // default consumer
    this.readSC();

    var start = this.scanner.tokenStart;
    var end = start;
    var children = this.readAtruleExpression();

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
