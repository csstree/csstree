module.exports = {
    name: 'Selector',
    parse: function() {
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
    },
    generate: function(node) {
        return this.each(node.children);
    },
    walk: function(node, context, walk) {
        node.children.each(walk);
    }
};
