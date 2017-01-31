var TYPE = require('../../scanner').TYPE;

var COLON = TYPE.Colon;
var EXCLAMATIONMARK = TYPE.ExclamationMark;
var SOLIDUS = TYPE.Solidus;
var ASTERISK = TYPE.Asterisk;
var DOLLARSIGN = TYPE.DollarSign;
var HYPHENMINUS = TYPE.HyphenMinus;
var SEMICOLON = TYPE.Semicolon;
var BALANCED = true;

function readProperty() {
    var start = this.scanner.tokenStart;
    var type;

    for (; type = this.scanner.tokenType; this.scanner.next()) {
        if (type !== SOLIDUS &&
            type !== ASTERISK &&
            type !== DOLLARSIGN) {
            break;
        }
    }

    this.scanIdent(true);

    return this.scanner.substrToCursor(start);
}

// ! ws* important
function getImportant() {
    this.scanner.eat(EXCLAMATIONMARK);
    this.readSC();

    this.scanner.expectIdentifier('important');

    // should return identifier in future for original source restoring as is
    // returns true for now since it's fit to optimizer purposes
    return true;
}

module.exports = function Declaration() {
    var start = this.scanner.tokenStart;
    var property = readProperty.call(this);
    var important = false;
    var value;

    this.readSC();
    this.scanner.eat(COLON);

    if (property.length >= 2 &&
        property.charCodeAt(0) === HYPHENMINUS &&
        property.charCodeAt(1) === HYPHENMINUS) {
        value = this.Raw(BALANCED, SEMICOLON, EXCLAMATIONMARK);
    } else {
        value = this.Value(property);
    }

    if (this.scanner.tokenType === EXCLAMATIONMARK) {
        important = getImportant.call(this);
        this.readSC();
    }

    // TODO: include or not to include semicolon to range?
    // if (this.scanner.tokenType === SEMICOLON) {
    //     this.scanner.next();
    // }

    return {
        type: 'Declaration',
        loc: this.getLocation(start, this.scanner.tokenStart),
        important: important,
        property: property,
        value: value
    };
};
