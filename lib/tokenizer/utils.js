var constants = require('./const');
var charCodeDef = require('./char-code-definitions');
var isDigit = charCodeDef.isDigit;
var isHexDigit = charCodeDef.isHexDigit;
var isUppercaseLetter = charCodeDef.isUppercaseLetter;
var isLowercaseLetter = charCodeDef.isLowercaseLetter;
var isLetter = charCodeDef.isLetter;
var isNonAscii = charCodeDef.isNonAscii;
var isNameStart = charCodeDef.isNameStart;
var isName = charCodeDef.isName;
var isNonPrintable = charCodeDef.isNonPrintable;
var isNewline = charCodeDef.isNewline;
var isWhiteSpace = charCodeDef.isWhiteSpace;
var isValidEscape = charCodeDef.isValidEscape;
var isIdentifierStart = charCodeDef.isIdentifierStart;
var isNumberStart = charCodeDef.isNumberStart;
var PUNCTUATION = constants.PUNCTUATION;
var STOP_URL_RAW = constants.STOP_URL_RAW;
var CHARCODE = constants.CHARCODE;
var FULLSTOP = CHARCODE.FullStop;
var PLUSSIGN = CHARCODE.PlusSign;
var HYPHENMINUS = CHARCODE.HyphenMinus;
var DELIM = constants.TYPE.Delim;
var TAB = 9;
var N = 10;
var R = 13;
var SPACE = 32;
var BACK_SLASH = 92;
var E = 101; // 'e'.charCodeAt(0)

// detect BOM (https://en.wikipedia.org/wiki/Byte_order_mark)
function firstCharOffset(source) {
    if (source.length > 0) {
        if (source.charCodeAt(0) === 0xFEFF ||  // UTF-16BE
            source.charCodeAt(0) === 0xFFFE) {  // UTF-16LE
            return 1;
        }
    }

    return 0;
}

function getCharCode(source, offset) {
    return offset < source.length ? source.charCodeAt(offset) : 0;
}

function getNewlineLength(source, offset, code) {
    if (isNewline(code)) {
        if (code === R && offset + 1 < source.length && source.charCodeAt(offset + 1) === N) {
            return 2;
        }

        return 1;
    }

    return 0;
}

function cmpChar(testStr, offset, referenceCode) {
    var code = testStr.charCodeAt(offset);

    // code.toLowerCase() for A..Z
    if (isUppercaseLetter(code)) {
        code = code | 32;
    }

    return code === referenceCode;
}

function cmpStr(testStr, start, end, referenceStr) {
    if (end - start !== referenceStr.length) {
        return false;
    }

    if (start < 0 || end > testStr.length) {
        return false;
    }

    for (var i = start; i < end; i++) {
        var testCode = testStr.charCodeAt(i);
        var referenceCode = referenceStr.charCodeAt(i - start);

        // testCode.toLowerCase() for A..Z
        if (isUppercaseLetter(testCode)) {
            testCode = testCode | 32;
        }

        if (testCode !== referenceCode) {
            return false;
        }
    }

    return true;
}

function findWhiteSpaceStart(source, offset) {
    while (offset >= 0 && isWhiteSpace(source.charCodeAt(offset))) {
        offset--;
    }

    return offset + 1;
}

function findWhiteSpaceEnd(source, offset) {
    while (offset < source.length && isWhiteSpace(source.charCodeAt(offset))) {
        offset++;
    }

    return offset;
}

function findCommentEnd(source, offset) {
    var commentEnd = source.indexOf('*/', offset);

    if (commentEnd === -1) {
        return source.length;
    }

    return commentEnd + 2;
}

function findStringEnd(source, offset, quote) {
    for (; offset < source.length; offset++) {
        var code = source.charCodeAt(offset);

        // TODO: bad string
        if (code === BACK_SLASH) {
            offset++;
        } else if (code === quote) {
            offset++;
            break;
        }
    }

    return offset;
}

function findDecimalNumberEnd(source, offset) {
    while (offset < source.length && isDigit(source.charCodeAt(offset))) {
        offset++;
    }

    return offset;
}

function findNumberEnd(source, offset, allowFraction) {
    var code;

    offset = findDecimalNumberEnd(source, offset);

    // fraction: .\d+
    if (allowFraction && source.charCodeAt(offset) === FULLSTOP) {
        if (offset + 1 < source.length && isDigit(source.charCodeAt(offset + 1))) {
            offset = findDecimalNumberEnd(source, offset + 1);
        }
    }

    // exponent: e[+-]\d+
    if (offset + 1 < source.length) {
        if (cmpChar(source, offset, E)) { // case insensitive check for `e`
            code = source.charCodeAt(offset + 1);

            if (code === PLUSSIGN || code === HYPHENMINUS) {
                if (offset + 2 < source.length) {
                    code = source.charCodeAt(offset + 2);
                }
            }

            if (isDigit(code)) {
                offset = findDecimalNumberEnd(source, offset + 2);
            }
        }
    }

    return offset;
}

// § 4.3.7. Consume an escaped code point
function consumeEscaped(source, offset) {
    // It assumes that the U+005C REVERSE SOLIDUS (\) has already been consumed and
    // that the next input code point has already been verified to be part of a valid escape.
    offset += 2;

    // hex digit
    if (isHexDigit(getCharCode(source, offset - 1))) {
        // Consume as many hex digits as possible, but no more than 5.
        // Note that this means 1-6 hex digits have been consumed in total.
        for (var maxOffset = Math.min(source.length, offset + 5); offset < maxOffset; offset++) {
            if (!isHexDigit(getCharCode(source, offset))) {
                break;
            }
        }

        // If the next input code point is whitespace, consume it as well.
        var code = getCharCode(source, offset);
        if (isWhiteSpace(code)) {
            offset++;
            if (code === R && getCharCode(source, offset) === N) {
                offset++;
            }
        }
    }

    return offset;
}

// §4.3.11. Consume a name
// Note: This algorithm does not do the verification of the first few code points that are necessary 
// to ensure the returned code points would constitute an <ident-token>. If that is the intended use,
// ensure that the stream starts with an identifier before calling this algorithm.
function consumeName(source, offset) {
    // Let result initially be an empty string.
    // Repeatedly consume the next input code point from the stream:
    for (; offset < source.length; offset++) {
        var code = source.charCodeAt(offset);

        // name code point
        if (isName(code)) {
            // Append the code point to result.
            continue;
        }
        
        // the stream starts with a valid escape
        if (isValidEscape(code, getCharCode(source, offset + 1))) {
            // Consume an escaped code point. Append the returned code point to result.
            offset = consumeEscaped(source, offset) - 1;
            continue;
        }

        // anything else
        // Reconsume the current input code point. Return result.
        break;
    }

    return offset;
}

// §4.3.12. Consume a number
function consumeNumber(source, offset) {
    var code = source.charCodeAt(offset);

    // 2. If the next input code point is U+002B PLUS SIGN (+) or U+002D HYPHEN-MINUS (-),
    // consume it and append it to repr.
    if (code === 0x002B || code === 0x002D) {
        code = source.charCodeAt(offset += 1);
    }

    // 3. While the next input code point is a digit, consume it and append it to repr.
    if (isDigit(code)) {
        offset = findDecimalNumberEnd(source, offset + 1);
        code = source.charCodeAt(offset);
    }

    // 4. If the next 2 input code points are U+002E FULL STOP (.) followed by a digit, then:
    if (code === 0x002E && isDigit(source.charCodeAt(offset + 1))) {
        // 4.1 Consume them.
        // 4.2 Append them to repr.
        code = source.charCodeAt(offset += 2);

        // 4.3 Set type to "number".
        // TODO

        // 4.4 While the next input code point is a digit, consume it and append it to repr.

        offset = findDecimalNumberEnd(source, offset);
    }

    // 5. If the next 2 or 3 input code points are U+0045 LATIN CAPITAL LETTER E (E)
    // or U+0065 LATIN SMALL LETTER E (e), ... , followed by a digit, then:
    if (cmpChar(source, offset, E)) {
        var sign = 0;
        code = source.charCodeAt(offset + 1);

        // ... optionally followed by U+002D HYPHEN-MINUS (-) or U+002B PLUS SIGN (+) ...
        if (code === 0x002D || code === 0x002B) {
            sign = 1;
            code = source.charCodeAt(offset + 2);
        }

        // ... followed by a digit
        if (isDigit(code)) {
            // 5.1 Consume them.
            // 5.2 Append them to repr.

            // 5.3 Set type to "number".
            // TODO

            // 5.4 While the next input code point is a digit, consume it and append it to repr.
            offset = findDecimalNumberEnd(source, offset + 1 + sign + 1);
        }
    }

    return offset;
}

// § 4.3.14. Consume the remnants of a bad url
// ... its sole use is to consume enough of the input stream to reach a recovery point
// where normal tokenizing can resume.
function consumeBadUrlRemnants(source, offset) {
    // Repeatedly consume the next input code point from the stream:
    for (; offset < source.length; offset++) {
        var code = source.charCodeAt(offset);

        // U+0029 RIGHT PARENTHESIS ())
        // EOF
        if (code === 0x0029) {
            // Return.
            offset++;
            break;
        }

        if (isValidEscape(code, getCharCode(source, offset + 1))) {
            // Consume an escaped code point.
            // Note: This allows an escaped right parenthesis ("\)") to be encountered
            // without ending the <bad-url-token>. This is otherwise identical to 
            // the "anything else" clause.
            offset = consumeEscaped(source, offset);
        }
    }

    return offset;
}

// skip escaped unicode sequence that can ends with space
// [0-9a-f]{1,6}(\r\n|[ \n\r\t\f])?
function findEscapeEnd(source, offset) {
    for (var i = 0; i < 7 && offset + i < source.length; i++) {
        var code = source.charCodeAt(offset + i);

        if (i !== 6 && isHexDigit(code)) {
            continue;
        }

        if (i > 0) {
            offset += i - 1 + getNewlineLength(source, offset + i, code);
            if (code === SPACE || code === TAB) {
                offset++;
            }
        }

        break;
    }

    return offset;
}

function findIdentifierEnd(source, offset) {
    for (; offset < source.length; offset++) {
        var code = source.charCodeAt(offset);

        if (code === BACK_SLASH) {
            offset = findEscapeEnd(source, offset + 1);
        } else if (code < 0x80 && PUNCTUATION[code] === DELIM) {
            break;
        }
    }

    return offset;
}

function findUrlRawEnd(source, offset) {
    for (; offset < source.length; offset++) {
        var code = source.charCodeAt(offset);

        if (code === BACK_SLASH) {
            offset = findEscapeEnd(source, offset + 1);
        } else if (code < 0x80 && STOP_URL_RAW[code] === 1) {
            break;
        }
    }

    return offset;
}

module.exports = {
    firstCharOffset: firstCharOffset,

    isDigit: isDigit,
    isHexDigit: isHexDigit,
    isUppercaseLetter: isUppercaseLetter,
    isLowercaseLetter: isLowercaseLetter,
    isLetter: isLetter,
    isNonAscii: isNonAscii,
    isNameStart: isNameStart,
    isName: isName,
    isNonPrintable: isNonPrintable,
    isNewline: isNewline,
    isWhiteSpace: isWhiteSpace,
    isValidEscape: isValidEscape,
    isIdentifierStart: isIdentifierStart,
    isNumberStart: isNumberStart,

    consumeEscaped: consumeEscaped,
    consumeName: consumeName,
    consumeNumber: consumeNumber,
    consumeBadUrlRemnants: consumeBadUrlRemnants,

    cmpChar: cmpChar,
    cmpStr: cmpStr,

    findWhiteSpaceStart: findWhiteSpaceStart,
    findWhiteSpaceEnd: findWhiteSpaceEnd,
    findCommentEnd: findCommentEnd,
    findStringEnd: findStringEnd,
    findDecimalNumberEnd: findDecimalNumberEnd,
    findNumberEnd: findNumberEnd,
    findEscapeEnd: findEscapeEnd,
    findIdentifierEnd: findIdentifierEnd,
    findUrlRawEnd: findUrlRawEnd
};
