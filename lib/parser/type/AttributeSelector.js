var TYPE = require('../../tokenizer').TYPE;

var IDENTIFIER = TYPE.Identifier;
var STRING = TYPE.String;
var DOLLARSIGN = TYPE.DollarSign;
var ASTERISK = TYPE.Asterisk;
var COLON = TYPE.Colon;
var EQUALSSIGN = TYPE.EqualsSign;
var LEFTSQUAREBRACKET = TYPE.LeftSquareBracket;
var RIGHTSQUAREBRACKET = TYPE.RightSquareBracket;
var CIRCUMFLEXACCENT = TYPE.CircumflexAccent;
var VERTICALLINE = TYPE.VerticalLine;
var TILDE = TYPE.Tilde;

function getAttributeName() {
    if (this.scanner.eof) {
        this.scanner.error('Unexpected end of input');
    }

    var start = this.scanner.tokenStart;
    var expectIdentifier = false;
    var checkColon = true;

    if (this.scanner.tokenType === ASTERISK) {
        expectIdentifier = true;
        checkColon = false;
        this.scanner.next();
    } else if (this.scanner.tokenType !== VERTICALLINE) {
        this.scanner.eat(IDENTIFIER);
    }

    if (this.scanner.tokenType === VERTICALLINE) {
        if (this.scanner.lookupType(1) !== EQUALSSIGN) {
            this.scanner.next();
            this.scanner.eat(IDENTIFIER);
        } else if (expectIdentifier) {
            this.scanner.error('Identifier is expected', this.scanner.tokenEnd);
        }
    } else if (expectIdentifier) {
        this.scanner.error('Vertical line is expected');
    }

    if (checkColon && this.scanner.tokenType === COLON) {
        this.scanner.next();
        this.scanner.eat(IDENTIFIER);
    }

    return {
        type: 'Identifier',
        loc: this.getLocation(start, this.scanner.tokenStart),
        name: this.scanner.substrToCursor(start)
    };
}

function getOperator() {
    var start = this.scanner.tokenStart;
    var tokenType = this.scanner.tokenType;

    if (tokenType !== EQUALSSIGN &&        // =
        tokenType !== TILDE &&             // ~=
        tokenType !== CIRCUMFLEXACCENT &&  // ^=
        tokenType !== DOLLARSIGN &&        // $=
        tokenType !== ASTERISK &&          // *=
        tokenType !== VERTICALLINE         // |=
    ) {
        this.scanner.error('Attribute selector (=, ~=, ^=, $=, *=, |=) is expected');
    }

    if (tokenType === EQUALSSIGN) {
        this.scanner.next();
    } else {
        this.scanner.next();
        this.scanner.eat(EQUALSSIGN);
    }

    return this.scanner.substrToCursor(start);
}

// '[' S* attrib_name ']'
// '[' S* attrib_name S* attrib_match S* [ IDENT | STRING ] S* attrib_flags? S* ']'
module.exports = function AttributeSelector() {
    var start = this.scanner.tokenStart;
    var name;
    var operator = null;
    var value = null;
    var flags = null;

    this.scanner.eat(LEFTSQUAREBRACKET);
    this.readSC();

    name = getAttributeName.call(this);
    this.readSC();

    if (this.scanner.tokenType !== RIGHTSQUAREBRACKET) {
        // avoid case `[name i]`
        if (this.scanner.tokenType !== IDENTIFIER) {
            operator = getOperator.call(this);

            this.readSC();

            value = this.scanner.tokenType === STRING
                ? this.String()
                : this.Identifier();

            this.readSC();
        }

        // attribute flags
        if (this.scanner.tokenType === IDENTIFIER) {
            flags = this.scanner.getTokenValue();
            this.scanner.next();

            this.readSC();
        }
    }

    this.scanner.eat(RIGHTSQUAREBRACKET);

    return {
        type: 'AttributeSelector',
        loc: this.getLocation(start, this.scanner.tokenStart),
        name: name,
        operator: operator,
        value: value,
        flags: flags
    };
};
