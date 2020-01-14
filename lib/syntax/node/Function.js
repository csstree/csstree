const {
    Function: FunctionToken,
    RightParenthesis
} = require('../../tokenizer/types');


// <function-token> <sequence> )
module.exports = {
    name: 'Function',
    structure: {
        name: String,
        children: [[]]
    },
    parse: function(readSequence, recognizer) {
        const start = this.tokenStart;
        const name = this.consumeFunctionName();
        const nameLowerCase = name.toLowerCase();
        let children;

        children = recognizer.hasOwnProperty(nameLowerCase)
            ? recognizer[nameLowerCase].call(this, recognizer)
            : readSequence.call(this, recognizer);

        if (!this.eof) {
            this.eat(RightParenthesis);
        }

        return {
            type: 'Function',
            loc: this.getLocation(start, this.tokenStart),
            name,
            children
        };
    },
    generate: function(node) {
        this.token(FunctionToken, node.name + '(');
        this.children(node);
        this.token(RightParenthesis, ')');
    },
    walkContext: 'function'
};
