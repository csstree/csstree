var isCustomProperty = require('../../utils/names').isCustomProperty;
var TYPE = require('../../tokenizer').TYPE;
var rawMode = require('./Raw').mode;

var IDENT = TYPE.Ident;
var HASH = TYPE.Hash;
var COLON = TYPE.Colon;
var SEMICOLON = TYPE.Semicolon;
var DELIM = TYPE.Delim;
var EXCLAMATIONMARK = 0x0021; // U+0021 EXCLAMATION MARK (!)
var NUMBERSIGN = 0x0023;      // U+0023 NUMBER SIGN (#)
var DOLLARSIGN = 0x0024;      // U+0024 DOLLAR SIGN ($)
var AMPERSAND = 0x0026;       // U+0026 ANPERSAND (&)
var ASTERISK = 0x002A;        // U+002A ASTERISK (*)
var PLUSSIGN = 0x002B;        // U+002B PLUS SIGN (+)
var SOLIDUS = 0x002F;         // U+002F SOLIDUS (/)

function consumeValueRaw(startToken) {
    return this.Raw(startToken, rawMode.exclamationMarkOrSemicolon, true);
}

function consumeCustomPropertyRaw(startToken) {
    return this.Raw(startToken, rawMode.exclamationMarkOrSemicolon, false);
}

function consumeValue() {
    var startValueToken = this.tokenIndex;
    var value = this.Value();

    if (value.type !== 'Raw' &&
        this.eof === false &&
        this.tokenType !== SEMICOLON &&
        this.isDelim(EXCLAMATIONMARK) === false &&
        this.isBalanceEdge(startValueToken) === false) {
        this.error();
    }

    return value;
}

module.exports = {
    name: 'Declaration',
    structure: {
        important: [Boolean, String],
        property: String,
        value: ['Value', 'Raw']
    },
    parse: function() {
        var start = this.tokenStart;
        var startToken = this.tokenIndex;
        var property = readProperty.call(this);
        var customProperty = isCustomProperty(property);
        var parseValue = customProperty ? this.parseCustomProperty : this.parseValue;
        var consumeRaw = customProperty ? consumeCustomPropertyRaw : consumeValueRaw;
        var important = false;
        var value;

        this.skipSC();
        this.eat(COLON);

        if (!customProperty) {
            this.skipSC();
        }

        if (parseValue) {
            value = this.parseWithFallback(consumeValue, consumeRaw);
        } else {
            value = consumeRaw.call(this, this.tokenIndex);
        }

        if (this.isDelim(EXCLAMATIONMARK)) {
            important = getImportant.call(this);
            this.skipSC();
        }

        // Do not include semicolon to range per spec
        // https://drafts.csswg.org/css-syntax/#declaration-diagram

        if (this.eof === false &&
            this.tokenType !== SEMICOLON &&
            this.isBalanceEdge(startToken) === false) {
            this.error();
        }

        return {
            type: 'Declaration',
            loc: this.getLocation(start, this.tokenStart),
            important: important,
            property: property,
            value: value
        };
    },
    generate: function(node) {
        this.chunk(node.property);
        this.chunk(':');
        this.node(node.value);

        if (node.important) {
            this.chunk(node.important === true ? '!important' : '!' + node.important);
        }
    },
    walkContext: 'declaration'
};

function readProperty() {
    var start = this.tokenStart;
    var prefix = 0;

    // hacks
    if (this.tokenType === DELIM) {
        switch (this.source.charCodeAt(this.tokenStart)) {
            case ASTERISK:
            case DOLLARSIGN:
            case PLUSSIGN:
            case NUMBERSIGN:
            case AMPERSAND:
                this.next();
                break;

            // TODO: not sure we should support this hack
            case SOLIDUS:
                this.next();
                if (this.isDelim(SOLIDUS)) {
                    this.next();
                }
                break;
        }
    }

    if (prefix) {
        this.skip(prefix);
    }

    if (this.tokenType === HASH) {
        this.eat(HASH);
    } else {
        this.eat(IDENT);
    }

    return this.substrToCursor(start);
}

// ! ws* important
function getImportant() {
    this.eat(DELIM);
    this.skipSC();

    var important = this.consume(IDENT);

    // store original value in case it differ from `important`
    // for better original source restoring and hacks like `!ie` support
    return important === 'important' ? true : important;
}
