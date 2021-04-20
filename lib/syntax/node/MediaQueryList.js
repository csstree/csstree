import { Comma } from '../../tokenizer/index.js';

export default {
    name: 'MediaQueryList',
    structure: {
        children: [[
            'MediaQuery'
        ]]
    },
    parse: function() {
        const children = this.createList();

        this.skipSC();

        while (!this.eof) {
            children.push(this.MediaQuery());

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
        this.children(node, () => this.token(Comma, ','));
    }
};
