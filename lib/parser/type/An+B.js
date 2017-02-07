var cmpChar = require('../../tokenizer').cmpChar;
var isNumber = require('../../tokenizer').isNumber;
var TYPE = require('../../tokenizer').TYPE;

var IDENTIFIER = TYPE.Identifier;
var NUMBER = TYPE.Number;
var PLUSSIGN = TYPE.PlusSign;
var HYPHENMINUS = TYPE.HyphenMinus;
var N = 110; // 'n'.charCodeAt(0)

function checkTokenIsInteger(scanner) {
    var pos = scanner.tokenStart;

    if (scanner.source.charCodeAt(pos) === PLUSSIGN ||
        scanner.source.charCodeAt(pos) === HYPHENMINUS) {
        pos++;
    }

    for (; pos < scanner.tokenEnd; pos++) {
        if (!isNumber(scanner.source.charCodeAt(pos))) {
            scanner.error('Unexpected input', pos);
        }
    }
}

// An+B microsyntax https://www.w3.org/TR/css-syntax-3/#anb
module.exports = function AnPlusB() {
    var start = this.scanner.tokenStart;
    var end = start;
    var prefix = '';
    var a = null;
    var b = null;

    if (this.scanner.tokenType === PLUSSIGN ||
        this.scanner.tokenType === NUMBER) {
        checkTokenIsInteger(this.scanner);
        prefix = this.scanner.getTokenValue();
        this.scanner.next();
        end = this.scanner.tokenStart;
    }

    if (this.scanner.tokenType === IDENTIFIER) {
        var bStart = this.scanner.tokenStart;

        if (cmpChar(this.scanner.source, bStart, HYPHENMINUS)) {
            if (prefix === '') {
                prefix = '-';
                bStart++;
            } else {
                this.scanner.error('Unexpected hyphen minus');
            }
        }

        if (!cmpChar(this.scanner.source, bStart, N)) {
            this.scanner.error();
        }

        a = prefix === '' || prefix === '+' ? '1' :
            prefix === '-' ? '-1' :
            prefix;

        var len = this.scanner.tokenEnd - bStart;
        if (len > 1) {
            // ..n-..
            if (this.scanner.source.charCodeAt(bStart + 1) !== HYPHENMINUS) {
                this.scanner.error('Unexpected input', bStart + 1);
            }

            this.scanner.tokenStart = bStart + 1;

            // ..n-{number}..
            if (len > 2) {
                for (var i = bStart + 2; i < this.scanner.tokenEnd; i++) {
                    if (!isNumber(this.scanner.source.charCodeAt(i))) {
                        this.scanner.error('Unexpected input', i);
                    }
                }

                this.scanner.next();
                b = '-' + this.scanner.substrToCursor(bStart + 2);
            } else {
                this.scanner.next();
                this.readSC();

                if (this.scanner.tokenType !== NUMBER ||
                    cmpChar(this.scanner.source, this.scanner.tokenStart, PLUSSIGN) ||
                    cmpChar(this.scanner.source, this.scanner.tokenStart, HYPHENMINUS)) {
                    this.scanner.error();
                }

                b = '-' + this.scanner.getTokenValue();
                this.scanner.next();
                end = this.scanner.tokenStart;
            }
        } else {
            prefix = '';
            this.scanner.next();
            end = this.scanner.tokenStart;
            this.readSC();

            if (this.scanner.tokenType === HYPHENMINUS ||
                this.scanner.tokenType === PLUSSIGN) {
                prefix = this.scanner.getTokenValue();
                this.scanner.next();
                end = this.scanner.tokenStart;
                this.readSC();
            }

            if (this.scanner.tokenType === NUMBER) {
                checkTokenIsInteger(this.scanner);

                if (cmpChar(this.scanner.source, this.scanner.tokenStart, PLUSSIGN) ||
                    cmpChar(this.scanner.source, this.scanner.tokenStart, HYPHENMINUS)) {
                    // prefix or sign should be specified but not both
                    if (prefix !== '') {
                        this.scanner.error();
                    }

                    prefix = this.scanner.source.charAt(this.scanner.tokenStart);
                    this.scanner.tokenStart++;
                }

                if (prefix === '') {
                    // should be an operator before number
                    this.scanner.error();
                } else if (prefix === '+') {
                    // plus is using by default
                    prefix = '';
                }

                b = prefix + this.scanner.getTokenValue();

                this.scanner.next();
                end = this.scanner.tokenStart;
            }
        }
    } else {
        if (prefix === '' || prefix === '-' || prefix === '+') { // no number
            this.scanner.error('Number or identifier is expected');
        }

        b = prefix;
    }

    return {
        type: 'An+B',
        loc: this.getLocation(start, end),
        a: a,
        b: b
    };
};
