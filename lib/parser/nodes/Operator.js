// '/' | '*' | ',' | ':' | '+' | '-'
module.exports = function Operator() {
    var start = this.scanner.tokenStart;

    this.scanner.next();

    return {
        type: 'Operator',
        loc: this.getLocation(start, this.scanner.tokenStart),
        value: this.scanner.substrToCursor(start)
    };
};
