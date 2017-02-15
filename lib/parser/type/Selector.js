module.exports = function Selector() {
    var children = this.readSequence(this.scopeSelector);

    // nothing were consumed
    if (children.isEmpty()) {
        this.scanner.error('Selector is expected');
    }

    return {
        type: 'Selector',
        loc: this.getLocationFromList(children),
        children: children
    };
};
