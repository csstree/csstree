// '/' | '*' | ',' | ':' | '+' | '-'
module.exports = {
    name: 'Operator',
    structure: {
        value: String
    },
    parse: function() {
        const start = this.tokenStart;

        this.next();

        return {
            type: 'Operator',
            loc: this.getLocation(start, this.tokenStart),
            value: this.substrToCursor(start)
        };
    },
    generate: function(node) {
        this.tokenize(node.value);
    }
};
