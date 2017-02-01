module.exports = function Identifier(varAllowed) {
    var start = this.scanner.tokenStart;
    var name = this.readIdent(varAllowed);

    return {
        type: 'Identifier',
        loc: this.getLocation(start, this.scanner.tokenStart),
        name: name
    };
};
