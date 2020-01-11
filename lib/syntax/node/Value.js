module.exports = {
    name: 'Value',
    structure: {
        children: [[]]
    },
    parse: function() {
        const start = this.tokenStart;
        const children = this.readSequence(this.scope.Value);

        return {
            type: 'Value',
            loc: this.getLocation(start, this.tokenStart),
            children
        };
    },
    generate: function(node) {
        this.children(node);
    }
};
