var NUMBER = require('../../tokenizer').TYPE.Number;

module.exports = {
    name: 'Number',
    samples: [
        '1', '-1',
        '.2', '-.2',
        '3.4', '-3.4',
        '1e3', '-1.2e2'
    ],
    structure: {
        value: String
    },
    parse: function() {
        return {
            type: 'Number',
            loc: this.getLocation(this.scanner.tokenStart, this.scanner.tokenEnd),
            value: this.scanner.consume(NUMBER)
        };
    },
    generate: function(processChunk, node) {
        processChunk(node.value);
    }
};
