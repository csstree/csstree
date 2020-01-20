const { isHexDigit, isNewline, isWhiteSpace, isValidEscape } = require('../tokenizer/char-code-definitions');
const { consumeEscaped } = require('../tokenizer/utils');

const REVERSE_SOLIDUS = 0x005c;  // \
const QUOTATION_MARK = 0x0022;   // "
const APOSTROPHE = 0x0027;       // '
const LEFTPARENTHESIS = 0x0028;  // U+0028 LEFT PARENTHESIS (()
const RIGHTPARENTHESIS = 0x0029; // U+0029 RIGHT PARENTHESIS ())

function decodeEscaped(escaped) {
    if (escaped.length === 1 && !isHexDigit(escaped.charCodeAt(0))) {
        return escaped[0];
    }

    let code = parseInt(escaped, 16);

    if (
        (code === 0) ||                       // If this number is zero,
        (code >= 0xD800 && code <= 0xDFFF) || // or is for a surrogate,
        (code > 0x10FFFF)                     // or is greater than the maximum allowed code point
    ) {
        // ... return U+FFFD REPLACEMENT CHARACTER
        code = 0xFFFD;
    }

    return String.fromCodePoint(code);
}

function decode(str) {
    const len = str.length;
    let start = 4; // length of "url("
    let end = str.charCodeAt(len - 1) === RIGHTPARENTHESIS ? len - 2 : len - 1;
    let decoded = '';

    while (start < end && isWhiteSpace(str.charCodeAt(start))) {
        start++;
    }

    while (start < end && isWhiteSpace(str.charCodeAt(end))) {
        end--;
    }

    for (let i = start; i <= end; i++) {
        let code = str.charCodeAt(i);

        if (code === REVERSE_SOLIDUS) {
            // special case at the ending
            if (i === end) {
                // if the next input code point is EOF, do nothing
                // otherwise include last quote as escaped
                if (i !== len - 1) {
                    decoded = str.substr(i + 1);
                }
                break;
            }

            code = str.charCodeAt(++i);

            // consume escaped
            if (isValidEscape(REVERSE_SOLIDUS, code)) {
                const escapeStart = i - 1;
                const escapeEnd = consumeEscaped(str, escapeStart);

                i = escapeEnd - 1;
                decoded += decodeEscaped(str.substring(escapeStart + 1, escapeEnd));
            } else {
                // \r\n
                if (code === 0x000d && str.charCodeAt(i + 1) === 0x000a) {
                    i++;
                }
            }
        } else {
            decoded += str[i];
        }
    }

    return decoded;
}

function encode(str) {
    let encoded = '';
    let wsBeforeHexIsNeeded = false;

    for (let i = 0; i < str.length; i++) {
        let code = str.charCodeAt(i);

        if (isNewline(code)) {
            encoded += '\\' + code.toString(16);
            wsBeforeHexIsNeeded = true;
        } else if (isWhiteSpace(code) ||
                   code === REVERSE_SOLIDUS ||
                   code === QUOTATION_MARK ||
                   code === APOSTROPHE ||
                   code === LEFTPARENTHESIS ||
                   code === RIGHTPARENTHESIS) {
            encoded += '\\' + str.charAt(i);
            wsBeforeHexIsNeeded = false;
        } else {
            if (wsBeforeHexIsNeeded && isHexDigit(code)) {
                encoded += ' ';
            }

            encoded += str.charAt(i);
            wsBeforeHexIsNeeded = false;
        }
    }

    return 'url(' + encoded + ')';
}

module.exports = {
    decode,
    encode
};
