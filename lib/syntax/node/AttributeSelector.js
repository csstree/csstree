var TYPE = require('../../tokenizer').TYPE;

var IDENT = TYPE.Ident;
var STRING = TYPE.String;
var COLON = TYPE.Colon;
var LEFTSQUAREBRACKET = TYPE.LeftSquareBracket;
var RIGHTSQUAREBRACKET = TYPE.RightSquareBracket;
var DOLLARSIGN = 0x0024;       // U+0024 DOLLAR SIGN ($)
var ASTERISK = 0x002A;         // U+002A ASTERISK (*)
var EQUALSSIGN = 0x003D;       // U+003D EQUALS SIGN (=)
var CIRCUMFLEXACCENT = 0x005E; // U+005E (^)
var VERTICALLINE = 0x007C;     // U+007C VERTICAL LINE (|)
var TILDE = 0x007E;            // U+007E TILDE (~)

function getAttributeName() {
    if (this.eof) {
        this.error('Unexpected end of input');
    }

    var start = this.tokenStart;
    var expectIdent = false;
    var checkColon = true;

    if (this.isDelim(ASTERISK)) {
        expectIdent = true;
        checkColon = false;
        this.next();
    } else if (!this.isDelim(VERTICALLINE)) {
        this.eat(IDENT);
    }

    if (this.isDelim(VERTICALLINE)) {
        if (this.charCodeAt(this.tokenStart + 1) !== EQUALSSIGN) {
            this.next();
            this.eat(IDENT);
        } else if (expectIdent) {
            this.error('Identifier is expected', this.tokenEnd);
        }
    } else if (expectIdent) {
        this.error('Vertical line is expected');
    }

    if (checkColon && this.tokenType === COLON) {
        this.next();
        this.eat(IDENT);
    }

    return {
        type: 'Identifier',
        loc: this.getLocation(start, this.tokenStart),
        name: this.substrToCursor(start)
    };
}

function getOperator() {
    var start = this.tokenStart;
    var code = this.charCodeAt(start);

    if (code !== EQUALSSIGN &&        // =
        code !== TILDE &&             // ~=
        code !== CIRCUMFLEXACCENT &&  // ^=
        code !== DOLLARSIGN &&        // $=
        code !== ASTERISK &&          // *=
        code !== VERTICALLINE         // |=
    ) {
        this.error('Attribute selector (=, ~=, ^=, $=, *=, |=) is expected');
    }

    this.next();

    if (code !== EQUALSSIGN) {
        if (!this.isDelim(EQUALSSIGN)) {
            this.error('Equal sign is expected');
        }

        this.next();
    }

    return this.substrToCursor(start);
}

// '[' <wq-name> ']'
// '[' <wq-name> <attr-matcher> [ <string-token> | <ident-token> ] <attr-modifier>? ']'
module.exports = {
    name: 'AttributeSelector',
    structure: {
        name: 'Identifier',
        matcher: [String, null],
        value: ['String', 'Identifier', null],
        flags: [String, null]
    },
    parse: function() {
        var start = this.tokenStart;
        var name;
        var matcher = null;
        var value = null;
        var flags = null;

        this.eat(LEFTSQUAREBRACKET);
        this.skipSC();

        name = getAttributeName.call(this);
        this.skipSC();

        if (this.tokenType !== RIGHTSQUAREBRACKET) {
            // avoid case `[name i]`
            if (this.tokenType !== IDENT) {
                matcher = getOperator.call(this);

                this.skipSC();

                value = this.tokenType === STRING
                    ? this.String()
                    : this.Identifier();

                this.skipSC();
            }

            // attribute flags
            if (this.tokenType === IDENT) {
                flags = this.getTokenValue();
                this.next();

                this.skipSC();
            }
        }

        this.eat(RIGHTSQUAREBRACKET);

        return {
            type: 'AttributeSelector',
            loc: this.getLocation(start, this.tokenStart),
            name: name,
            matcher: matcher,
            value: value,
            flags: flags
        };
    },
    generate: function(node) {
        var flagsPrefix = ' ';

        this.chunk('[');
        this.node(node.name);

        if (node.matcher !== null) {
            this.chunk(node.matcher);

            if (node.value !== null) {
                this.node(node.value);

                // space between string and flags is not required
                if (node.value.type === 'String') {
                    flagsPrefix = '';
                }
            }
        }

        if (node.flags !== null) {
            this.chunk(flagsPrefix);
            this.chunk(node.flags);
        }

        this.chunk(']');
    }
};
