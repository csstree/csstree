const {
    Ident,
    Function,
    Colon,
    RightParenthesis
} = require('../../tokenizer/types');

// : [ <ident> | <function-token> <any-value>? ) ]
module.exports = {
    name: 'PseudoClassSelector',
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

        if (this.tokenType === Function) {
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
            type: 'PseudoClassSelector',
            loc: this.getLocation(start, this.tokenStart),
            name,
            children
        };
    },
    generate: function(node) {
        this.chunk(':');
        this.chunk(node.name);

        if (node.children !== null) {
            this.chunk('(');
            this.children(node);
            this.chunk(')');
        }
    },
    walkContext: 'function'
};
