module.exports = {
    name: 'Nth',
    structure: {
        nth: ['AnPlusB', 'Identifier'],
        selector: ['SelectorList', null]
    },
    parse: function(allowOfClause) {
        this.skipSC();

        var start = this.tokenStart;
        var end = start;
        var selector = null;
        var query;

        if (this.lookupValue(0, 'odd') || this.lookupValue(0, 'even')) {
            query = this.Identifier();
        } else {
            query = this.AnPlusB();
        }

        end = this.tokenStart;
        this.skipSC();

        if (allowOfClause && this.lookupValue(0, 'of')) {
            this.next();

            selector = this.SelectorList();
            end = this.tokenStart;
        }

        return {
            type: 'Nth',
            loc: this.getLocation(start, end),
            nth: query,
            selector: selector
        };
    },
    generate: function(node) {
        this.node(node.nth);
        if (node.selector !== null) {
            this.chunk(' of ');
            this.node(node.selector);
        }
    }
};
