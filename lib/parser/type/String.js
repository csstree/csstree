module.exports = function String() {
    var start = this.scanner.tokenStart;

    this.scanner.next();

    return {
        type: 'String',
        loc: this.getLocation(start, this.scanner.tokenStart),
        value: this.scanner.substrToCursor(start)
    };
};
