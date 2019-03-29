var TYPE = require('../../tokenizer').TYPE;
var CHARCODE = require('../../tokenizer').CHARCODE;

var rawMode = require('../node/Raw').mode;

var IDENTIFIER = TYPE.Identifier;
var COMMA = TYPE.Comma;
var HYPHENMINUS = CHARCODE.HyphenMinus;

// var '(' ident (',' <value>? )? ')'
module.exports = function() {
    var children = this.createList();

    this.scanner.skipSC();

    var identStart = this.scanner.tokenStart;
    var ident = this.scanner.getTokenValue();

    // A custom property is any property whose name starts with two dashes (U+002D HYPHEN-MINUS)
    // The <custom-property-name> production corresponds to this: it’s defined as any valid identifier
    // that starts with two dashes, ...
    for (var i = 0; i < 2 && identStart + i < this.scanner.source.length; i++) {
        if (this.scanner.source.charCodeAt(identStart + i) !== HYPHENMINUS) {
            this.error('HyphenMinus is expected', identStart + i);
        }
    }

    // ... except `--` itself, which is reserved for future use by CSS
    if (ident.length < 3) {
        this.error('Name is expected', identStart + ident.length);
    }

    this.eat(IDENTIFIER);

    children.push({
        type: 'Identifier',
        loc: this.getLocation(identStart, this.scanner.tokenStart),
        name: this.scanner.substrToCursor(identStart)
    });

    this.scanner.skipSC();

    if (this.scanner.tokenType === COMMA) {
        children.push(this.Operator());
        children.push(this.parseCustomProperty
            ? this.Value(null)
            : this.Raw(this.scanner.tokenIndex, rawMode.exclamationMarkOrSemicolon, false)
        );
    }

    return children;
};
