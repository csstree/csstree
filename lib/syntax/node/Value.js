module.exports = {
    name: 'Value',
    structure: {
        children: [[]]
    },
    parse: function() {
        var start = this.tokenStart;
        var children = this.readSequence(this.scope.Value);

        return {
            type: 'Value',
            loc: this.getLocation(start, this.tokenStart),
            children: children
        };
    },
    generate: function(node) {
        this.children(node);
    }
};
