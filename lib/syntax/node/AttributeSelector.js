var TYPE = require('../../tokenizer').TYPE;
var CHARCODE = require('../../tokenizer').CHARCODE;

var IDENTIFIER = TYPE.Identifier;
var STRING = TYPE.String;
var COLON = TYPE.Colon;
var LEFTSQUAREBRACKET = TYPE.LeftSquareBracket;
var RIGHTSQUAREBRACKET = TYPE.RightSquareBracket;
var DOLLARSIGN = CHARCODE.DollarSign;
var ASTERISK = CHARCODE.Asterisk;
var EQUALSSIGN = CHARCODE.EqualsSign;
var CIRCUMFLEXACCENT = CHARCODE.CircumflexAccent;
var VERTICALLINE = CHARCODE.VerticalLine;
var TILDE = CHARCODE.Tilde;

function getAttributeName() {
    if (this.scanner.eof) {
        this.error('Unexpected end of input');
    }

    var start = this.scanner.tokenStart;
    var expectIdentifier = false;
    var checkColon = true;

    if (this.scanner.isDelim(ASTERISK)) {
        expectIdentifier = true;
        checkColon = false;
        this.scanner.next();
    } else if (!this.scanner.isDelim(VERTICALLINE)) {
        this.eat(IDENTIFIER);
    }

    if (this.scanner.isDelim(VERTICALLINE)) {
        if (this.scanner.source.charCodeAt(this.scanner.tokenStart + 1) !== EQUALSSIGN) {
            this.scanner.next();
            this.eat(IDENTIFIER);
        } else if (expectIdentifier) {
            this.error('Identifier is expected', this.scanner.tokenEnd);
        }
    } else if (expectIdentifier) {
        this.error('Vertical line is expected');
    }

    if (checkColon && this.scanner.tokenType === COLON) {
        this.scanner.next();
        this.eat(IDENTIFIER);
    }

    return {
        type: 'Identifier',
        loc: this.getLocation(start, this.scanner.tokenStart),
        name: this.scanner.substrToCursor(start)
    };
}

function getOperator() {
    var start = this.scanner.tokenStart;
    var code = this.scanner.source.charCodeAt(start);

    if (code !== EQUALSSIGN &&        // =
        code !== TILDE &&             // ~=
        code !== CIRCUMFLEXACCENT &&  // ^=
        code !== DOLLARSIGN &&        // $=
        code !== ASTERISK &&          // *=
        code !== VERTICALLINE         // |=
    ) {
        this.error('Attribute selector (=, ~=, ^=, $=, *=, |=) is expected');
    }

    this.scanner.next();

    if (code !== EQUALSSIGN) {
        if (!this.scanner.isDelim(EQUALSSIGN)) {
            this.error('Equal sign is expected');
        }

        this.scanner.next();
    }

    return this.scanner.substrToCursor(start);
}

// '[' S* attrib_name ']'
// '[' S* attrib_name S* attrib_matcher S* [ IDENT | STRING ] S* attrib_flags? S* ']'
module.exports = {
    name: 'AttributeSelector',
    structure: {
        name: 'Identifier',
        matcher: [String, null],
        value: ['String', 'Identifier', null],
        flags: [String, null]
    },
    parse: function() {
        var start = this.scanner.tokenStart;
        var name;
        var matcher = null;
        var value = null;
        var flags = null;

        this.eat(LEFTSQUAREBRACKET);
        this.scanner.skipSC();

        name = getAttributeName.call(this);
        this.scanner.skipSC();

        if (this.scanner.tokenType !== RIGHTSQUAREBRACKET) {
            // avoid case `[name i]`
            if (this.scanner.tokenType !== IDENTIFIER) {
                matcher = getOperator.call(this);

                this.scanner.skipSC();

                value = this.scanner.tokenType === STRING
                    ? this.String()
                    : this.Identifier();

                this.scanner.skipSC();
            }

            // attribute flags
            if (this.scanner.tokenType === IDENTIFIER) {
                flags = this.scanner.getTokenValue();
                this.scanner.next();

                this.scanner.skipSC();
            }
        }

        this.eat(RIGHTSQUAREBRACKET);

        return {
            type: 'AttributeSelector',
            loc: this.getLocation(start, this.scanner.tokenStart),
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
