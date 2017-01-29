// special reader for units to avoid adjoined IE hacks (i.e. '1px\9')
function readUnit() {
    var unit = this.scanner.getTokenValue();
    var backSlashPos = unit.indexOf('\\');

    if (backSlashPos !== -1) {
        // patch token offset
        this.scanner.tokenStart += backSlashPos;
        // this.scanner.token.start = this.scanner.tokenStart;

        // return part before backslash
        return unit.substring(0, backSlashPos);
    }

    // no backslash in unit name
    this.scanner.next();

    return unit;
}

// number ident
module.exports = function Dimension() {
    var start = this.scanner.tokenStart;
    var value = this.readNumber();
    var unit = readUnit.call(this);

    return {
        type: 'Dimension',
        loc: this.getLocation(start, this.scanner.tokenStart),
        value: value,
        unit: unit
    };
};
