const {
    WhiteSpace,
    Comment,
    Semicolon,
    AtKeyword,
    LeftCurlyBracket,
    RightCurlyBracket
} = require('../../tokenizer/types');

function consumeRaw(startToken) {
    return this.Raw(startToken, null, true);
}
function consumeRule() {
    return this.parseWithFallback(this.Rule, consumeRaw);
}
function consumeRawDeclaration(startToken) {
    return this.Raw(startToken, this.consumeUntilSemicolonIncluded, true);
}
function consumeDeclaration() {
    if (this.tokenType === Semicolon) {
        return consumeRawDeclaration.call(this, this.tokenIndex);
    }

    const node = this.parseWithFallback(this.Declaration, consumeRawDeclaration);

    if (this.tokenType === Semicolon) {
        this.next();
    }

    return node;
}

module.exports = {
    name: 'Block',
    structure: {
        children: [[
            'Atrule',
            'Rule',
            'Declaration'
        ]]
    },
    parse: function(isDeclaration) {
        const consumer = isDeclaration ? consumeDeclaration : consumeRule;
        const start = this.tokenStart;
        let children = this.createList();

        this.eat(LeftCurlyBracket);

        scan:
        while (!this.eof) {
            switch (this.tokenType) {
                case RightCurlyBracket:
                    break scan;

                case WhiteSpace:
                case Comment:
                    this.next();
                    break;

                case AtKeyword:
                    children.push(this.parseWithFallback(this.Atrule, consumeRaw));
                    break;

                default:
                    children.push(consumer.call(this));
            }
        }

        if (!this.eof) {
            this.eat(RightCurlyBracket);
        }

        return {
            type: 'Block',
            loc: this.getLocation(start, this.tokenStart),
            children
        };
    },
    generate: function(node) {
        this.token(LeftCurlyBracket, '{');
        this.children(node, prev => {
            if (prev.type === 'Declaration') {
                this.token(Semicolon, ';');
            }
        });
        this.token(RightCurlyBracket, '}');
    },
    walkContext: 'block'
};
