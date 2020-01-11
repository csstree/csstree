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
        this.skipSC();

        const children = this.createList();
        let child = null;
        let space = null;

        scan:
        while (!this.eof) {
            switch (this.tokenType) {
                case Comment:
                    this.next();
                    continue;

                case WhiteSpace:
                    space = this.WhiteSpace();
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

            if (space !== null) {
                children.push(space);
                space = null;
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
