
module.exports = function Identifier() {
    var start = this.scanner.tokenStart;
    var name = this.readIdent();

    return {
        type: 'Identifier',
        loc: this.getLocation(start, this.scanner.tokenStart),
        name: name
    };
};
