import { Comma } from '../../tokenizer/index.js';

export default {
    name: 'SelectorList',
    structure: {
        children: [[
            'Selector',
            'Raw'
        ]]
    },
    parse: function() {
        const children = this.createList();

        while (!this.eof) {
            children.push(this.Selector());

            if (this.tokenType === Comma) {
                this.next();
                continue;
            }

            break;
        }

        return {
            type: 'SelectorList',
            loc: this.getLocationFromList(children),
            children
        };
    },
    generate: function(node) {
        this.children(node, () => this.token(Comma, ','));
    },
    walkContext: 'selector'
};
