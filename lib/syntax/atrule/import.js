const {
    String: StringToken,
    Ident,
    Url,
    Function: FunctionToken,
    LeftParenthesis
} = require('../../tokenizer/types');

module.exports = {
    parse: {
        prelude: function() {
            const children = this.createList();

            this.skipSC();

            switch (this.tokenType) {
                case StringToken:
                    children.push(this.String());
                    break;

                case Url:
                case FunctionToken:
                    children.push(this.Url());
                    break;

                default:
                    this.error('String or url() is expected');
            }

            if (this.lookupNonWSType(0) === Ident ||
                this.lookupNonWSType(0) === LeftParenthesis) {
                children.push(this.MediaQueryList());
            }

            return children;
        },
        block: null
    }
};
