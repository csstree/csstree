const {
    WhiteSpace,
    Comment,
    Ident,
    LeftParenthesis
} = require('../../tokenizer/types');

module.exports = {
    name: 'MediaQuery',
    structure: {
        children: [[
            'Identifier',
            'MediaFeature',
            'WhiteSpace'
        ]]
    },
    parse: function() {
        const children = this.createList();
        let child = null;

        this.skipSC();

        scan:
        while (!this.eof) {
            switch (this.tokenType) {
                case Comment:
                case WhiteSpace:
                    this.next();
                    continue;

                case Ident:
                    child = this.Identifier();
                    break;

                case LeftParenthesis:
                    child = this.MediaFeature();
                    break;

                default:
                    break scan;
            }

            children.push(child);
        }

        if (child === null) {
            this.error('Identifier or parenthesis is expected');
        }

        return {
            type: 'MediaQuery',
            loc: this.getLocationFromList(children),
            children
        };
    },
    generate: function(node) {
        this.children(node);
    }
};
