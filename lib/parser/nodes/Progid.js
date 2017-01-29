module.exports = function Progid(progidEnd) {
    var start = this.scanner.tokenStart;

    this.scanner.skip(progidEnd);

    return {
        type: 'Progid',
        loc: this.getLocation(start, this.scanner.tokenStart),
        value: this.scanner.substrToCursor(start)
    };
};
