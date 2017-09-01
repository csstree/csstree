module.exports = {
    name: 'Raw',
    structure: {
        value: String
    },
    parse: function(length) {
        var start = this.scanner.tokenStart;

        this.scanner.skip(length);

        return {
            type: 'Raw',
            loc: this.getLocation(start, this.scanner.tokenStart),
            value: this.scanner.substrToCursor(start)
        };
    },
    generate: function(processChunk, node) {
        processChunk(node.value);
    }
};
