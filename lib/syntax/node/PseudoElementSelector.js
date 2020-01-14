const {
    Ident,
    Function: FunctionToken,
    Colon,
    RightParenthesis
} = require('../../tokenizer/types');

// :: [ <ident> | <function-token> <any-value>? ) ]
module.exports = {
    name: 'PseudoElementSelector',
    structure: {
        name: String,
        children: [['Raw'], null]
    },
    parse: function() {
        const start = this.tokenStart;
        let children = null;
        let name;
        let nameLowerCase;

        this.eat(Colon);
        this.eat(Colon);

        if (this.tokenType === FunctionToken) {
            name = this.consumeFunctionName();
            nameLowerCase = name.toLowerCase();

            if (hasOwnProperty.call(this.pseudo, nameLowerCase)) {
                this.skipSC();
                children = this.pseudo[nameLowerCase].call(this);
                this.skipSC();
            } else {
                children = this.createList();
                children.push(
                    this.Raw(this.tokenIndex, null, false)
                );
            }

            this.eat(RightParenthesis);
        } else {
            name = this.consume(Ident);
        }

        return {
            type: 'PseudoElementSelector',
            loc: this.getLocation(start, this.tokenStart),
            name,
            children
        };
    },
    generate: function(node) {
        this.token(Colon, ':');
        this.token(Colon, ':');

        if (node.children === null) {
            this.token(Ident, node.name);
        } else {
            this.token(FunctionToken, node.name + '(');
            this.children(node);
            this.token(RightParenthesis, ')');
        }
    },
    walkContext: 'function'
};
