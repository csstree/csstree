const { Comma } = require('../../tokenizer/types');

module.exports = {
    name: 'MediaQueryList',
    structure: {
        children: [[
            'MediaQuery'
        ]]
    },
    parse: function(relative) {
        const children = this.createList();

        this.skipSC();

        while (!this.eof) {
            children.push(this.MediaQuery(relative));

            if (this.tokenType !== Comma) {
                break;
            }

            this.next();
        }

        return {
            type: 'MediaQueryList',
            loc: this.getLocationFromList(children),
            children
        };
    },
    generate: function(node) {
        this.children(node, function() {
            this.chunk(',');
        });
    }
};
