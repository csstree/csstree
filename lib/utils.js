function isHex(code) {
    return (code >= 48 && code <= 57) || // 0 .. 9
           (code >= 65 && code <= 70) || // A .. F
           (code >= 97 && code <= 102);  // a .. f
}

function cmpStr(testStr, start, end, referenceStr) {
    if (start < 0 || end > testStr.length) {
        return false;
    }

    if (end - start !== referenceStr.length) {
        return false;
    }

    for (var i = start; i < end; i++) {
        var sourceCode = testStr.charCodeAt(i);
        var strCode = referenceStr.charCodeAt(i - start);

        // referenceStr[i].toLowerCase()
        if (sourceCode >= 65 && sourceCode <= 90) {
            sourceCode = sourceCode | 32;
        }

        if (sourceCode !== strCode) {
            return false;
        }
    }

    return true;
}

module.exports = {
    isHex: isHex,
    cmpStr: cmpStr
};
