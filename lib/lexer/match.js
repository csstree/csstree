var hasOwnProperty = Object.prototype.hasOwnProperty;
var matchGraph = require('./match-graph');
var MATCH = matchGraph.MATCH;
var MISMATCH = matchGraph.MISMATCH;
var DISALLOW_EMPTY = matchGraph.DISALLOW_EMPTY;
var TYPE = require('../tokenizer/const').TYPE;

var TOKEN = 1;
var OPEN_SYNTAX = 2;
var CLOSE_SYNTAX = 3;

var EXIT_REASON_MATCH = 'Match';
var EXIT_REASON_MISMATCH = 'Mismatch';
var EXIT_REASON_ITERATION_LIMIT = 'Maximum iteration number exceeded (please fill an issue on https://github.com/csstree/csstree/issues)';

var ITERATION_LIMIT = 10000;
var totalIterationCount = 0;

function mapList(list, fn) {
    var result = [];

    while (list) {
        result.unshift(fn(list));
        list = list.prev;
    }

    return result;
}

function areStringsEqualCaseInsensitive(testStr, referenceStr) {
    if (testStr.length !== referenceStr.length) {
        return false;
    }

    for (var i = 0; i < testStr.length; i++) {
        var testCode = testStr.charCodeAt(i);
        var referenceCode = referenceStr.charCodeAt(i);

        // testCode.toLowerCase() for U+0041 LATIN CAPITAL LETTER A (A) .. U+005A LATIN CAPITAL LETTER Z (Z).
        if (testCode >= 0x0041 && testCode <= 0x005A) {
            testCode = testCode | 32;
        }

        if (testCode !== referenceCode) {
            return false;
        }
    }

    return true;
}

function isCommaContextStart(token) {
    if (token === null) {
        return true;
    }

    var ch = token.value.charAt(token.value.length - 1);

    return (
        ch === ',' ||
        ch === '(' ||
        ch === '[' ||
        ch === '/'
    );
}

function isCommaContextEnd(token) {
    if (token === null) {
        return true;
    }

    var ch = token.value.charAt(0);

    return (
        ch === ')' ||
        ch === ']' ||
        ch === '/'
    );
}

function internalMatch(tokens, syntax, syntaxes) {
    function moveToNextToken() {
        do {
            tokenCursor++;
            token = tokenCursor < tokens.length ? tokens[tokenCursor] : null;
        } while (token !== null && !/\S/.test(token.value));
    }

    function getNextToken(offset) {
        var nextIndex = tokenCursor + offset;

        return nextIndex < tokens.length ? tokens[nextIndex] : null;
    }

    function pushThenStack(nextSyntax) {
        thenStack = {
            nextSyntax: nextSyntax,
            matchStack: matchStack,
            syntaxStack: syntaxStack,
            prev: thenStack
        };
    }

    function pushElseStack(nextSyntax) {
        elseStack = {
            nextSyntax: nextSyntax,
            matchStack: matchStack,
            syntaxStack: syntaxStack,
            thenStack: thenStack,
            tokenCursor: tokenCursor,
            token: token,
            prev: elseStack
        };
    }

    function addTokenToMatch() {
        matchStack = {
            type: TOKEN,
            syntax: syntax.syntax,
            token: token,
            prev: matchStack
        };

        moveToNextToken();

        if (syntaxStash !== null) {
            syntaxStash = null;
        }

        if (tokenCursor > longestMatch) {
            longestMatch = tokenCursor;
        }
    }

    function openSyntax() {
        syntaxStack = {
            syntax: syntax,
            opts: syntax.syntax.opts || (syntaxStack !== null && syntaxStack.opts) || null,
            prev: syntaxStack
        };

        matchStack = {
            type: OPEN_SYNTAX,
            syntax: syntax.syntax,
            token: matchStack.token,
            prev: matchStack
        };
    }

    function closeSyntax() {
        if (matchStack.type === OPEN_SYNTAX) {
            matchStack = matchStack.prev;
        } else {
            matchStack = {
                type: CLOSE_SYNTAX,
                syntax: syntaxStack.syntax,
                token: matchStack.token,
                prev: matchStack
            };
        }

        syntaxStack = syntaxStack.prev;
    }

    var syntaxStack = null;
    var thenStack = null;
    var elseStack = null;
    var syntaxStash = null;

    var iterationCount = 0;
    var exitReason = EXIT_REASON_MATCH;

    var matchStack = { type: 'Stub', syntax: null, token: null, tokenCursor: -1, prev: null };
    var longestMatch = 0;
    var tokenCursor = -1;
    var token = null;

    moveToNextToken();

    while (true) {
        // console.log('--\n',
        //     '#' + iterationCount,
        //     require('util').inspect({
        //         match: mapList(matchStack, x => x.type === TOKEN ? x.token && x.token.value : x.syntax ? x.type + '!' + x.syntax.name : null),
        //         elseStack: mapList(elseStack, x => x.id),
        //         thenStack: mapList(thenStack, x => x.id),
        //         token: token && token.value,
        //         tokenCursor,
        //         syntax
        //     }, { depth: null })
        // );

        // prevent infinite loop
        if (++iterationCount === ITERATION_LIMIT) {
            console.warn('[csstree-match] BREAK after ' + ITERATION_LIMIT + ' iterations');
            exitReason = EXIT_REASON_ITERATION_LIMIT;
            break;
        }

        if (syntax === MATCH) {
            if (thenStack === null) {
                // turn to MISMATCH when some tokens left unmatched
                if (token !== null) {
                    // doesn't mismatch if just one token left and it's an IE hack
                    if (tokenCursor !== tokens.length - 1 || (token.value !== '\\0' && token.value !== '\\9')) {
                        syntax = MISMATCH;
                        continue;
                    }
                }

                // break the main loop, return a result - MATCH
                exitReason = EXIT_REASON_MATCH;
                break;
            }

            // go to next syntax (`then` branch)
            syntax = thenStack.nextSyntax;

            // check match is not empty
            if (syntax === DISALLOW_EMPTY) {
                if (thenStack.matchStack.token === matchStack.token) {
                    syntax = MISMATCH;
                    continue;
                } else {
                    syntax = MATCH;
                }
            }

            // close syntax if needed
            while (syntaxStack !== null && thenStack.syntaxStack !== syntaxStack) {
                closeSyntax();
            }

            // pop stack
            thenStack = thenStack.prev;
            continue;
        }

        if (syntax === MISMATCH) {
            if (elseStack === null) {
                if (syntaxStash === null || syntaxStash === false) {
                    // no else branches and no stashed syntax -> break the main loop
                    // return a result - MISMATCH
                    exitReason = EXIT_REASON_MISMATCH;
                    break;
                }

                // restore from the stash
                elseStack = syntaxStash;
                syntaxStash = false; // disable stashing
            }

            // go to next syntax (`else` branch)
            syntax = elseStack.nextSyntax;

            // restore all the rest stack states
            thenStack = elseStack.thenStack;
            syntaxStack = elseStack.syntaxStack;
            matchStack = elseStack.matchStack;
            tokenCursor = elseStack.tokenCursor;
            token = elseStack.token;

            // pop stack
            elseStack = elseStack.prev;
            continue;
        }

        switch (syntax.type) {
            case 'MatchGraph':
                syntax = syntax.match;
                break;

            case 'If':
                if (syntax.checkStash) {
                    if (syntaxStash !== null) {
                        if (syntaxStash !== false) {
                            elseStack = syntaxStash;
                            syntaxStash = false; // disable stashing
                            syntax = MISMATCH;
                            break;
                        }

                        syntaxStash = null;
                    }
                }

                // IMPORTANT: else stack push must go first,
                // since it stores the state of thenStack before changes
                if (syntax.else !== MISMATCH) {
                    pushElseStack(syntax.else);
                }

                if (syntax.then !== MATCH) {
                    pushThenStack(syntax.then);
                }

                syntax = syntax.match;
                break;

            case 'MatchOnce':
                syntax = {
                    type: 'MatchOnceBuffer',
                    terms: syntax.terms,
                    all: syntax.all,
                    matchStack: matchStack,
                    index: 0,
                    mask: 0
                };
                break;

            case 'MatchOnceBuffer':
                if (syntax.index === syntax.terms.length) {
                    // if no matches during a cycle
                    if (syntax.matchStack === matchStack) {
                        // no matches at all or it's required all terms to be matched
                        if (syntax.mask === 0 || syntax.all) {
                            syntax = MISMATCH;
                            break;
                        }

                        // a partial match is ok
                        syntax = MATCH;
                        break;
                    } else {
                        // start trying to match from the start
                        syntax.index = 0;
                        syntax.matchStack = matchStack;
                    }
                }

                for (; syntax.index < syntax.terms.length; syntax.index++) {
                    if ((syntax.mask & (1 << syntax.index)) === 0) {
                        // IMPORTANT: else stack push must go first,
                        // since it stores the state of thenStack before changes
                        pushElseStack(syntax);
                        pushThenStack({
                            type: 'AddMatchOnce',
                            buffer: syntax
                        });

                        // match
                        syntax = syntax.terms[syntax.index++];
                        break;
                    }
                }
                break;

            case 'AddMatchOnce':
                syntax = syntax.buffer;

                var newMask = syntax.mask | (1 << (syntax.index - 1));

                // all terms are matched
                if (newMask === (1 << syntax.terms.length) - 1) {
                    syntax = MATCH;
                    continue;
                }

                syntax = {
                    type: 'MatchOnceBuffer',
                    terms: syntax.terms,
                    all: syntax.all,
                    matchStack: syntax.matchStack,
                    index: 0,
                    mask: newMask
                };

                break;

            case 'Enum':
                if (token !== null) {
                    var name = token.value.toLowerCase();

                    // drop \0 and \9 hack from keyword name
                    if (name.indexOf('\\') !== -1) {
                        name = name.replace(/\\[09].*$/, '');
                    }

                    if (hasOwnProperty.call(syntax.map, name)) {
                        syntax = syntax.map[name];
                        break;
                    }
                }

                syntax = MISMATCH;
                break;

            case 'Generic':
                var opts = syntaxStack !== null ? syntaxStack.opts : null;
                var tokenCount = Math.floor(syntax.fn(token, getNextToken, opts));

                if (!isNaN(tokenCount) && tokenCount > 0) {
                    for (var lastTokenIndex = tokenCursor + tokenCount; tokenCursor < lastTokenIndex;) {
                        addTokenToMatch();
                    }

                    syntax = MATCH;
                } else {
                    syntax = MISMATCH;
                }

                break;

            case 'Type':
            case 'Property':
                var syntaxDict = syntax.type === 'Type' ? 'types' : 'properties';
                var dictSyntax = hasOwnProperty.call(syntaxes, syntaxDict) ? syntaxes[syntaxDict][syntax.name] : null;

                if (!dictSyntax || !dictSyntax.match) {
                    throw new Error(
                        'Bad syntax reference: ' +
                        (syntax.type === 'Type'
                            ? '<' + syntax.name + '>'
                            : '<\'' + syntax.name + '\'>')
                    );
                }

                // stash a syntax for types with low priority
                if (syntaxStash !== false && token !== null && syntax.type === 'Type') {
                    var lowPriorityMatching =
                        // https://drafts.csswg.org/css-values-4/#custom-idents
                        // When parsing positionally-ambiguous keywords in a property value, a <custom-ident> production
                        // can only claim the keyword if no other unfulfilled production can claim it.
                        (syntax.name === 'custom-ident' && token.type === TYPE.Ident) ||

                        // https://drafts.csswg.org/css-values-4/#lengths
                        // ... if a `0` could be parsed as either a <number> or a <length> in a property (such as line-height),
                        // it must parse as a <number>
                        (syntax.name === 'length' && token.value === '0');

                    if (lowPriorityMatching) {
                        if (syntaxStash === null) {
                            pushElseStack(syntax);
                            syntaxStash = elseStack;
                            elseStack = elseStack.prev;
                        }

                        syntax = MISMATCH;
                        break;
                    }
                }

                openSyntax();
                syntax = dictSyntax.match;
                break;

            case 'Keyword':
                var name = syntax.name;

                if (token !== null) {
                    var keywordName = token.value;

                    // drop \0 and \9 hack from keyword name
                    if (keywordName.indexOf('\\') !== -1) {
                        keywordName = keywordName.replace(/\\[09].*$/, '');
                    }

                    if (areStringsEqualCaseInsensitive(keywordName, name)) {
                        addTokenToMatch();

                        syntax = MATCH;
                        break;
                    }
                }

                syntax = MISMATCH;
                break;

            case 'AtKeyword':
            case 'Function':
                if (token !== null && areStringsEqualCaseInsensitive(token.value, syntax.name)) {
                    addTokenToMatch();

                    syntax = MATCH;
                    break;
                }

                syntax = MISMATCH;
                break;

            case 'Token':
                if (token !== null && token.value === syntax.value) {
                    addTokenToMatch();

                    syntax = MATCH;
                    break;
                }

                syntax = MISMATCH;
                break;

            case 'Comma':
                if (token !== null && token.value === ',') {
                    if (isCommaContextStart(matchStack.token)) {
                        syntax = MISMATCH;
                    } else {
                        addTokenToMatch();
                        syntax = isCommaContextEnd(token) ? MISMATCH : MATCH;
                    }
                } else {
                    syntax = isCommaContextStart(matchStack.token) || isCommaContextEnd(token) ? MATCH : MISMATCH;
                }

                break;

            case 'String':
                var string = '';

                for (var lastTokenIndex = tokenCursor; lastTokenIndex < tokens.length && string.length < syntax.value.length; lastTokenIndex++) {
                    string += tokens[lastTokenIndex].value;
                }

                if (areStringsEqualCaseInsensitive(string, syntax.value)) {
                    for (; tokenCursor < lastTokenIndex;) {
                        addTokenToMatch();
                    }

                    syntax = MATCH;
                } else {
                    syntax = MISMATCH;
                }

                break;

            default:
                throw new Error('Unknown node type: ' + syntax.type);
        }
    }

    totalIterationCount += iterationCount;

    if (exitReason === EXIT_REASON_MATCH) {
        while (syntaxStack !== null) {
            closeSyntax();
        }
    } else {
        matchStack = null;
    }

    return {
        tokens: tokens,
        reason: exitReason,
        iterations: iterationCount,
        match: matchStack,
        longestMatch: longestMatch
    };
}

function matchAsList(tokens, matchGraph, syntaxes) {
    var matchResult = internalMatch(tokens, matchGraph, syntaxes || {});

    if (matchResult.match !== null) {
        matchResult.match = mapList(matchResult.match, function(item) {
            if (item.type === OPEN_SYNTAX || item.type === CLOSE_SYNTAX) {
                return { type: item.type, syntax: item.syntax };
            }

            return {
                syntax: item.syntax,
                token: item.token && item.token.value,
                node: item.token && item.token.node
            };
        }).slice(1);
    }

    return matchResult;
}

function matchAsTree(tokens, matchGraph, syntaxes) {
    var matchResult = internalMatch(tokens, matchGraph, syntaxes || {});

    if (matchResult.match === null) {
        return matchResult;
    }

    var cursor = matchResult.match;
    var host = matchResult.match = {
        syntax: matchGraph.syntax || null,
        match: []
    };
    var stack = [host];

    // revert a list
    var prev = null;
    var next = null;
    while (cursor !== null) {
        next = cursor.prev;
        cursor.prev = prev;
        prev = cursor;
        cursor = next;
    }

    // init the cursor to start with 2nd item since 1st is a stub item
    cursor = prev.prev;

    // build a tree
    while (cursor !== null && cursor.syntax !== null) {
        var entry = cursor;

        switch (entry.type) {
            case OPEN_SYNTAX:
                host.match.push(host = {
                    syntax: entry.syntax,
                    match: []
                });
                stack.push(host);
                break;

            case CLOSE_SYNTAX:
                stack.pop();
                host = stack[stack.length - 1];
                break;

            default:
                host.match.push({
                    syntax: entry.syntax || null,
                    token: entry.token.value,
                    node: entry.token.node
                });
        }

        cursor = cursor.prev;
    }

    return matchResult;
}

module.exports = {
    matchAsList: matchAsList,
    matchAsTree: matchAsTree,
    getTotalIterationCount: function() {
        return totalIterationCount;
    }
};
