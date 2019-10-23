var COMMA = require('../../tokenizer').TYPE.Comma;

module.exports = {
    name: 'MediaQueryList',
    structure: {
        children: [[
            'MediaQuery'
        ]]
    },
    parse: function(relative) {
        var children = this.createList();

        this.skipSC();

        while (!this.eof) {
            children.push(this.MediaQuery(relative));

            if (this.tokenType !== COMMA) {
                break;
            }

            this.next();
        }

        return {
            type: 'MediaQueryList',
            loc: this.getLocationFromList(children),
            children: children
        };
    },
    generate: function(node) {
        this.children(node, function() {
            this.chunk(',');
        });
    }
};
