var TokenStream = require('../common/TokenStream');
var adoptBuffer = require('../common/adopt-buffer');

var constants = require('./const');
var TYPE = constants.TYPE;
var CHARCODE = constants.CHARCODE;
var SYMBOL_TYPE = constants.SYMBOL_TYPE;

var utils = require('./utils');
var firstCharOffset = utils.firstCharOffset;
var cmpStr = utils.cmpStr;
var isDigit = utils.isDigit;
var isName = utils.isName;
var isValidEscape = utils.isValidEscape;
var findWhiteSpaceEnd = utils.findWhiteSpaceEnd;
var findCommentEnd = utils.findCommentEnd;
var findStringEnd = utils.findStringEnd;
var findNumberEnd = utils.findNumberEnd;
var findIdentifierEnd = utils.findIdentifierEnd;
var findUrlRawEnd = utils.findUrlRawEnd;

var COMMA = CHARCODE.Comma;
var COLON = CHARCODE.Colon;
var SEMICOLON = CHARCODE.Semicolon;
var STAR = CHARCODE.Asterisk;
var SLASH = CHARCODE.Solidus;
var FULLSTOP = CHARCODE.FullStop;
var PLUSSIGN = CHARCODE.PlusSign;
var HYPHENMINUS = CHARCODE.HyphenMinus;
var GREATERTHANSIGN = CHARCODE.GreaterThanSign;
var LESSTHANSIGN = CHARCODE.LessThanSign;
var EXCLAMATIONMARK = CHARCODE.ExclamationMark;
var COMMERCIALAT = CHARCODE.CommercialAt;
var QUOTATIONMARK = CHARCODE.QuotationMark;
var APOSTROPHE = CHARCODE.Apostrophe;
var NUMBERSIGN = CHARCODE.NumberSign;
var PERCENTSIGN = CHARCODE.PercentSign;
var LEFTPARENTHESIS = CHARCODE.LeftParenthesis;
var RIGHTPARENTHESIS = CHARCODE.RightParenthesis;
var LEFTCURLYBRACKET = CHARCODE.LeftCurlyBracket;
var RIGHTCURLYBRACKET = CHARCODE.RightCurlyBracket;
var LEFTSQUAREBRACKET = CHARCODE.LeftSquareBracket;
var RIGHTSQUAREBRACKET = CHARCODE.RightSquareBracket;

var OFFSET_MASK = 0x00FFFFFF;
var TYPE_SHIFT = 24;

function tokenize(source, stream) {
    function getChar(offset) {
        return offset < sourceLength ? source.charCodeAt(offset) : 0;
    }

    if (!stream) {
        stream = new TokenStream();
    }

    // ensure source is a string
    source = String(source || '');

    var start = firstCharOffset(source);
    var sourceLength = source.length;
    var offsetAndType = adoptBuffer(stream.offsetAndType, sourceLength + 1); // +1 because of eof-token
    var balance = adoptBuffer(stream.balance, sourceLength + 1);
    var tokenCount = 0;
    var prevType = 0;
    var offset = start;
    var anchor = 0;
    var balanceCloseCode = 0;
    var balanceStart = 0;
    var balancePrev = 0;

    while (offset < sourceLength) {
        var code = source.charCodeAt(offset);
        var type = code < 0x80 ? SYMBOL_TYPE[code] : IDENTIFIER;

        balance[tokenCount] = sourceLength;

        switch (type) {
            case TYPE.WhiteSpace:
                offset = findWhiteSpaceEnd(source, offset + 1);
                break;

            case TYPE.Delim:
                switch (code) {
                    case balanceCloseCode:
                        balancePrev = balanceStart & OFFSET_MASK;
                        balanceStart = balance[balancePrev];
                        balanceCloseCode = balanceStart >> TYPE_SHIFT;
                        balance[tokenCount] = balancePrev;
                        balance[balancePrev++] = tokenCount;
                        for (; balancePrev < tokenCount; balancePrev++) {
                            if (balance[balancePrev] === sourceLength) {
                                balance[balancePrev] = tokenCount;
                            }
                        }
                        break;

                    case LEFTSQUAREBRACKET:
                        balance[tokenCount] = balanceStart;
                        balanceCloseCode = RIGHTSQUAREBRACKET;
                        balanceStart = (balanceCloseCode << TYPE_SHIFT) | tokenCount;
                        break;

                    case LEFTCURLYBRACKET:
                        balance[tokenCount] = balanceStart;
                        balanceCloseCode = RIGHTCURLYBRACKET;
                        balanceStart = (balanceCloseCode << TYPE_SHIFT) | tokenCount;
                        break;

                    case LEFTPARENTHESIS:
                        balance[tokenCount] = balanceStart;
                        balanceCloseCode = RIGHTPARENTHESIS;
                        balanceStart = (balanceCloseCode << TYPE_SHIFT) | tokenCount;
                        break;
                }

                // /*
                if (code === STAR && prevType === SLASH) {
                    type = TYPE.Comment;
                    offset = findCommentEnd(source, offset + 1);
                    tokenCount--; // rewrite prev token
                    break;
                }

                // NUMBER %
                if (code === PERCENTSIGN && prevType === TYPE.Number) {
                    type = TYPE.Percentage;
                    offset++;
                    tokenCount--;
                    break;
                }

                // edge case for -.123 and +.123
                if (code === FULLSTOP && (prevType === PLUSSIGN || prevType === HYPHENMINUS)) {
                    if (offset + 1 < sourceLength && isDigit(source.charCodeAt(offset + 1))) {
                        type = TYPE.Number;
                        offset = findNumberEnd(source, offset + 2, false);
                        tokenCount--; // rewrite prev token
                        break;
                    }
                }

                // <!--
                if (code === EXCLAMATIONMARK && prevType === LESSTHANSIGN) {
                    if (offset + 2 < sourceLength &&
                        source.charCodeAt(offset + 1) === HYPHENMINUS &&
                        source.charCodeAt(offset + 2) === HYPHENMINUS) {
                        type = TYPE.CDO;
                        offset = offset + 3;
                        tokenCount--; // rewrite prev token
                        break;
                    }
                }

                // -->
                if (code === HYPHENMINUS && prevType === HYPHENMINUS) {
                    if (offset + 1 < sourceLength && source.charCodeAt(offset + 1) === GREATERTHANSIGN) {
                        type = TYPE.CDC;
                        offset = offset + 2;
                        tokenCount--; // rewrite prev token
                        break;
                    }
                }

                // ident(
                if (code === LEFTPARENTHESIS && prevType === TYPE.Identifier) {
                    offset = offset + 1;
                    tokenCount--; // rewrite prev token
                    balance[tokenCount] = balance[tokenCount + 1];
                    balanceStart--;

                    // 4 char length identifier and equal to `url(` (case insensitive)
                    if (offset - anchor === 4 && cmpStr(source, anchor, offset, 'url(')) {
                        // special case for url() because it may contains any char sequence with few exceptions
                        anchor = findWhiteSpaceEnd(source, offset);
                        code = source.charCodeAt(anchor);
                        if (code !== LEFTPARENTHESIS &&
                            code !== RIGHTPARENTHESIS &&
                            code !== QUOTATIONMARK &&
                            code !== APOSTROPHE) {
                            // url(
                            offsetAndType[tokenCount++] = (TYPE.Url << TYPE_SHIFT) | offset;
                            balance[tokenCount] = sourceLength;

                            // ws*
                            if (anchor !== offset) {
                                offsetAndType[tokenCount++] = (TYPE.WhiteSpace << TYPE_SHIFT) | anchor;
                                balance[tokenCount] = sourceLength;
                            }

                            // raw
                            type = TYPE.Raw;
                            offset = findUrlRawEnd(source, anchor);
                        } else {
                            type = TYPE.Url;
                        }
                    } else {
                        type = TYPE.Function;
                    }
                    break;
                }

                if (code === NUMBERSIGN && offset + 1 < sourceLength) {
                    if (isName(getChar(offset + 1)) || isValidEscape(getChar(offset + 1), getChar(offset + 2))) {
                        offset = findIdentifierEnd(source, offset + 1);
                        type = TYPE.Hash;
                        break;
                    }
                }

                switch (code) {
                    case COMMA:
                        type = TYPE.Comma;
                        break;
                    
                    case COLON:
                        type = TYPE.Colon;
                        break;
                    
                    case SEMICOLON:
                        type = TYPE.Semicolon;
                        break;
                        
                    case LEFTPARENTHESIS:
                        type = TYPE.LeftParenthesis;
                        break;
                        
                    case RIGHTPARENTHESIS:
                        type = TYPE.RightParenthesis;
                        break;
                    
                    case LEFTSQUAREBRACKET:
                        type = TYPE.LeftSquareBracket;
                        break;
                    
                    case RIGHTSQUAREBRACKET:
                        type = TYPE.RightSquareBracket;
                        break;

                    case LEFTCURLYBRACKET:
                        type = TYPE.LeftCurlyBracket;
                        break;

                    case RIGHTCURLYBRACKET:
                        type = TYPE.RightCurlyBracket;
                        break;
                    
                    default:
                        type = code;
                }

                offset = offset + 1;
                break;

            case TYPE.Number:
                offset = findNumberEnd(source, offset + 1, prevType !== FULLSTOP);

                // merge number with a preceding dot, dash or plus
                if (prevType === FULLSTOP ||
                    prevType === HYPHENMINUS ||
                    prevType === PLUSSIGN) {
                    tokenCount--; // rewrite prev token
                }

                break;

            case TYPE.String:
                offset = findStringEnd(source, offset + 1, code);
                break;

            default: // IDENTIFIER
                anchor = offset;
                offset = findIdentifierEnd(source, offset);

                // merge identifier with a preceding dash
                if (prevType === HYPHENMINUS) {
                    // rewrite prev token
                    tokenCount--;
                    // restore prev prev token type
                    // for case @-prefix-ident
                    prevType = tokenCount === 0 ? 0 : offsetAndType[tokenCount - 1] >> TYPE_SHIFT;
                }

                if (prevType === COMMERCIALAT) {
                    // rewrite prev token and change type to <at-keyword-token>
                    tokenCount--;
                    type = TYPE.AtKeyword;
                } else if (prevType === TYPE.Number) {
                    tokenCount--;
                    type = TYPE.Dimension;
                }
        }

        offsetAndType[tokenCount++] = (type << TYPE_SHIFT) | offset;
        prevType = type;
    }

    // finalize arrays
    offsetAndType[tokenCount] = offset;
    balance[tokenCount] = sourceLength;
    balance[sourceLength] = sourceLength; // prevents false positive balance match with any token
    while (balanceStart !== 0) {
        balancePrev = balanceStart & OFFSET_MASK;
        balanceStart = balance[balancePrev];
        balance[balancePrev] = sourceLength;
    }

    // update stream
    stream.source = source;
    stream.firstCharOffset = start;
    stream.offsetAndType = offsetAndType;
    stream.tokenCount = tokenCount;
    stream.balance = balance;
    stream.reset();
    stream.next();

    return stream;
}

//
// tokenizer
//

// extend tokenizer with constants
Object.keys(constants).forEach(function(key) {
    tokenize[key] = constants[key];
});

// extend tokenizer with static methods from utils
Object.keys(utils).forEach(function(key) {
    tokenize[key] = utils[key];
});

module.exports = tokenize;
