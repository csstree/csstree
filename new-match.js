const csstree = require('./lib');

const MATCH = { type: 'Match' };
const MISMATCH = { type: 'Mismatch' };
const NON_EMPTY = { type: 'DisallowEmpty' };
const COMMA = { type: 'Comma' };
const hasOwnProperty = Object.prototype.hasOwnProperty;
let id = 1; // TODO: remove
let totalIterationCount = 0;

function createCondition(match, thenBranch, elseBranch) {
    // reduce node count
    if (thenBranch === MATCH && elseBranch === MISMATCH) {
        return match;
    }

    if (match === MATCH && thenBranch === MATCH && elseBranch === MATCH) {
        return match;
    }

    return {
        type: 'If',
        id: id++, // TODO: remove
        match: match,
        then: thenBranch,
        else: elseBranch
    };
}

function buildGroupMatchTree(combinator, terms, atLeastOneTermMatched) {
    switch (combinator) {
        case ' ':
            // Juxtaposing components means that all of them must occur, in the given order.
            //
            // a b c
            // =
            // match a
            //   then match b
            //     then match c
            //       then MATCH
            //       else MISMATCH
            //     else MISMATCH
            //   else MISMATCH
            var result = MATCH;

            for (var i = terms.length - 1; i >= 0; i--) {
                var term = terms[i];

                result = createCondition(
                    term,
                    result,
                    MISMATCH
                );
            };

            return result;

        case '|':
            // A bar (|) separates two or more alternatives: exactly one of them must occur.
            //
            // a | b | c
            // =
            // match a
            //   then MATCH
            //   else match b
            //     then MATCH
            //     else match c
            //       then MATCH
            //       else MISMATCH

            var result = MISMATCH;
            var prevKeyword = null;
            var map = null;

            for (var i = terms.length - 1; i >= 0; i--) {
                var term = terms[i];

                // reduce sequence of keywords into a Enum
                if (term.type === 'Keyword') {
                    if (prevKeyword !== null) {
                        if (map === null) {
                            map = Object.create(null);
                            if (result.type === 'If') {
                                map[result.match.name.toLowerCase()] = result.match;
                                result.match = {
                                    type: 'Enum',
                                    map: map
                                };
                            } else {
                                map[result.name.toLowerCase()] = result;
                                result = {
                                    type: 'Enum',
                                    map: map
                                };
                            }
                        }

                        map[term.name.toLowerCase()] = term;
                        continue;
                    }

                    prevKeyword = term;
                } else {
                    prevKeyword = null;
                    map = null;
                }

                // create a new conditonal node
                result = createCondition(
                    term,
                    MATCH,
                    result
                );
            };

            return result;

        case '&&':
            // A double ampersand (&&) separates two or more components, all of which must occur, in any order.
            //
            // a && b && c
            // =
            // match a
            //   then [b && c]
            //   else match b
            //     then [a && c]
            //     else match c
            //       then [a && b]
            //       else MISMATCH
            //
            // a && b
            // =
            // match a
            //   then match b
            //     then MATCH
            //     else MISMATCH
            //   else match b
            //     then match a
            //       then MATCH
            //       else MISMATCH
            //     else MISMATCH
            var result = MISMATCH;

            if (terms.length > 5) {
                return result;
            }

            for (var i = terms.length - 1; i >= 0; i--) {
                var term = terms[i];
                var thenClause;

                if (terms.length > 1) {
                    thenClause = buildGroupMatchTree(
                        combinator,
                        terms.filter(function(newGroupTerm) {
                            return newGroupTerm !== term;
                        }),
                        false
                    );
                } else {
                    thenClause = MATCH;
                }

                result = createCondition(
                    term,
                    thenClause,
                    result
                );
            };

            return result;

        case '||':
            // A double bar (||) separates two or more options: one or more of them must occur, in any order.
            //
            // a || b || c
            // =
            // match a
            //   then [b || c]
            //   else match b
            //     then [a || c]
            //     else match c
            //       then [a || b]
            //       else MISMATCH
            //
            // a || b
            // =
            // match a
            //   then match b
            //     then MATCH
            //     else MATCH
            //   else match b
            //     then match a
            //       then MATCH
            //       else MATCH
            //     else MISMATCH
            var result = atLeastOneTermMatched ? MATCH : MISMATCH;

            if (terms.length > 5) {
                return result;
            }

            for (var i = terms.length - 1; i >= 0; i--) {
                var term = terms[i];
                var thenClause;

                if (terms.length > 1) {
                    thenClause = buildGroupMatchTree(
                        combinator,
                        terms.filter(function(newGroupTerm) {
                            return newGroupTerm !== term;
                        }),
                        true
                    );
                } else {
                    thenClause = MATCH;
                }

                result = createCondition(
                    term,
                    thenClause,
                    result
                );
            };

            return result;
    }
}

function buildMultiplierMatchTree(node) {
    var matchTerm = buildMatchTree(node.term);
    var result = MATCH;

    if (node.max === 0) {
        // an occurrence count is not limited, make a cycle
        // to collect more terms on each following matching mismatch
        result = createCondition(
            matchTerm,
            null, // will be a loop
            MISMATCH
        );

        result.then = createCondition(
            MATCH,
            MATCH,
            result // make a loop
        );

        if (node.comma) {
            result.then.else = createCondition(
                COMMA,
                result,
                MISMATCH
            );
        }
    } else {
        // create a match node chain for [min .. max] interval with optional matches
        for (var i = node.min || 1; i <= node.max; i++) {
            if (node.comma && result !== MATCH) {
                result = createCondition(
                    COMMA,
                    result,
                    MISMATCH
                );
            }

            result = createCondition(
                matchTerm,
                createCondition(
                    MATCH,
                    MATCH,
                    result
                ),
                MISMATCH
            );
        }
    }

    if (node.min === 0) {
        // allow zero match
        result = createCondition(
            MATCH,
            MATCH,
            result
        );
    } else {
        // create a match node chain to collect [0 ... min - 1] required matches
        for (var i = 0; i < node.min - 1; i++) {
            if (node.comma && result !== MATCH) {
                result = createCondition(
                    COMMA,
                    result,
                    MISMATCH
                );
            }

            result = createCondition(
                matchTerm,
                result,
                MISMATCH
            );
        }
    }

    return result;
}

function buildMatchTree(node) {
    switch (node.type) {
        case 'Group':
            var result = buildGroupMatchTree(
                node.combinator,
                node.terms.map(buildMatchTree),
                false
            );

            if (node.disallowEmpty) {
                result = createCondition(
                    result,
                    NON_EMPTY,
                    MISMATCH
                );
            }

            return result;

        case 'Multiplier':
            return buildMultiplierMatchTree(node);

        case 'Function':
            return {
                type: 'Function',
                name: node.name
            };

        default:
            return node;
    }
}

function mapList(list, ref, fn) {
    var result = [];

    while (list) {
        result.unshift(fn(list));
        list = list[ref];
    }

    return result;
}

function internalMatch(tokens, syntax, syntaxes = {}) {
    function moveToNextToken() {
        do {
            tokenCursor++;
            token = tokenCursor < tokens.length ? tokens[tokenCursor] : null;
        } while (token !== null && !/\S/.test(token.value));

        return token;
    }

    function getNextToken(offset) {
        var nextIndex = tokenCursor + offset;

        return nextIndex < tokens.length ? tokens[nextIndex] : null;
    }

    function isCommaContextStart() {
        var lastMatchToken = matchStack.token;

        return (
            lastMatchToken === null ||
            lastMatchToken.value === ',' ||
            lastMatchToken.value === '(' ||
            lastMatchToken.value === '[' ||
            lastMatchToken.value === '/'
        );
    }

    function isCommaContextEnd() {
        return (
            token === null ||
            token.value === ')' ||
            token.value === ']' ||
            token.value === '/'
        );
    }

    function addTokenToStack() {
        var matchToken = token;
        var matchTokenCursor = tokenCursor;

        moveToNextToken();

        matchStack = {
            type: 'Token',
            size: matchStack.size + 1,
            syntax: syntaxNode,
            token: matchToken,
            tokenCursor: matchTokenCursor,
            prev: matchStack
        };

        if (matchStack.size > bestMatch.size) {
            bestMatch = matchStack;
        }
    }

    function openSyntax() {
        // console.log('Open syntax', syntaxNode);
        syntaxStack = {
            syntax: syntaxNode,
            prev: syntaxStack
        };

        matchStack = {
            type: 'Open',
            size: matchStack.size,
            syntax: syntaxNode,
            token: matchStack.token,
            tokenCursor: matchStack.tokenCursor,
            prev: matchStack
        };
    }

    function closeSyntax() {
        // console.log('Close syntax', syntaxStack.syntax);
        if (matchStack.type === 'Open') {
            matchStack = matchStack.prev;
        } else {
            matchStack = {
                type: 'Close',
                size: matchStack.size,
                syntax: syntaxStack.syntax,
                token: matchStack.token,
                tokenCursor: matchStack.tokenCursor,
                prev: matchStack
            };
        }

        syntaxStack = syntaxStack.prev;
    }

    var matchStack = { type: 'Stub', size: 0, syntax: null, token: null, tokenCursor: -1, prev: null };
    var bestMatch = matchStack;
    var tokenCursor = -1;
    var token = moveToNextToken();

    var syntaxStack = null;
    var ifStack = null;
    var alternative = null;
    var syntaxNode = syntax;

    var LIMIT = 5000;
    var iterationCount = 0;

    while (true) {
        // console.log('--\n',
        //     '#' + iterationCount,
        //     require('util').inspect({
        //         match: mapList(matchStack, 'prev', x => x.type === 'Token' ? x.token && x.token.value : x.syntax ? x.type + '!' + x.syntax.name : null),
        //         token: token,
        //         tokenCursor
        //     }, { depth: null })
        // );
        // console.log(token, syntaxNode);

        // prevent infinite loop
        if (++iterationCount === LIMIT) {
            console.log(`BREAK after ${LIMIT} steps`);
            break;
        }

        if (syntaxNode === MATCH) {
            if (ifStack === null) {
                // turn to MISMATCH when some tokens left unmatched
                if (token !== null && syntaxStack === null) {
                    syntaxNode = MISMATCH;
                    continue;
                }

                // break the main loop, return a result - MATCH
                break;
            }

            // go to `then` branch
            syntaxNode = ifStack.then;

            // save if stack top as an alternative for future
            if (alternative === null || alternative.matchStack.size <= ifStack.matchStack.size) {
                ifStack.alt = alternative;
                alternative = ifStack;
            }

            // close syntax if needed
            if (syntaxStack !== null && ifStack.syntaxStack !== syntaxStack) {
                closeSyntax();
            }

            // pop stack
            ifStack = ifStack.prev;
            continue;
        }

        if (syntaxNode === MISMATCH) {
            if (ifStack === null) {
                // try alternative match if any
                if (alternative !== null) {
                    ifStack = alternative;
                    alternative = alternative.alt;
                    continue;
                }

                // break the main loop, return a result - MISMATCH
                break;
            }

            // go to `else` branch
            syntaxNode = ifStack.else;

            // restore match stack state
            syntaxStack = ifStack.syntaxStack;
            matchStack = ifStack.matchStack;
            tokenCursor = matchStack.size === 0 ? -1 : matchStack.tokenCursor;
            token = moveToNextToken();

            // pop stack
            ifStack = ifStack.prev;
            continue;
        }

        switch (syntaxNode.type) {
            case 'If':
                // push new conditional node to stack
                ifStack = {
                    // id: syntaxNode.id,
                    then: syntaxNode.then,
                    else: syntaxNode.else,
                    matchStack: matchStack,
                    syntaxStack: syntaxStack,
                    prev: ifStack,
                    alt: null
                };

                syntaxNode = syntaxNode.match;

                break;

            case 'DisallowEmpty':
                syntaxNode = ifStack === null || matchStack === ifStack.matchStack ? MISMATCH : MATCH;
                break;

            case 'Type':
            case 'Property':
                ifStack = {
                    // id: syntaxNode.id,
                    then: MATCH,
                    else: MISMATCH,
                    matchStack: matchStack,
                    syntaxStack: syntaxStack,
                    prev: ifStack,
                    alt: null
                };

                openSyntax();

                var syntaxDict = syntaxNode.type === 'Type' ? 'types' : 'properties';
                if (hasOwnProperty.call(syntaxes, syntaxDict) && syntaxes[syntaxDict][syntaxNode.name]) {
                    syntaxNode = syntaxes[syntaxDict][syntaxNode.name];
                } else {
                    console.log('Unknown <type> reference:', syntaxNode.name);
                    syntaxNode = undefined;
                }

                if (!syntaxNode) {
                    // TODO: should raise an error?
                    syntaxNode = MISMATCH;
                }

                break;

            case 'Keyword':
                if (token !== null && token.value.toLowerCase() === syntaxNode.name) {
                    addTokenToStack();
                    syntaxNode = MATCH;
                } else {
                    syntaxNode = MISMATCH;
                }

                break;

            case 'Enum':
                if (token !== null) {
                    var name = token.value.toLowerCase();
                    if (hasOwnProperty.call(syntaxNode.map, name)) {
                        syntaxNode = syntaxNode.map[name];
                        addTokenToStack();
                        syntaxNode = MATCH;
                    } else {
                        syntaxNode = MISMATCH;
                    }
                } else {
                    syntaxNode = MISMATCH;
                }

                break;

            case 'Comma':
                if (token !== null && token.value === ',') {
                    if (isCommaContextStart()) {
                        syntaxNode = MISMATCH;
                    } else {
                        addTokenToStack();
                        syntaxNode = isCommaContextEnd() ? MISMATCH : MATCH;
                    }
                } else {
                    syntaxNode = isCommaContextStart() || isCommaContextEnd() ? MATCH : MISMATCH;
                }

                break;

            case 'Token':
                if (token !== null && token.value === syntaxNode.value) {
                    addTokenToStack();
                    syntaxNode = MATCH;
                } else {
                    syntaxNode = MISMATCH;
                }

                break;

            case 'Function':
                if (token !== null && token.value.toLowerCase() === syntaxNode.name) {
                    var nextToken = getNextToken(1);
                    if (nextToken !== null && nextToken.value === '(') {
                        addTokenToStack();
                        addTokenToStack();
                        syntaxNode = MATCH;
                    } else {
                        syntaxNode = MISMATCH;
                    }
                } else {
                    syntaxNode = MISMATCH;
                }

                break;

            case 'Generic':
                syntaxNode = syntaxNode.fn(token, addTokenToStack, getNextToken) ? MATCH : MISMATCH;
                break;

            // case 'String':
            // TODO

            default:
                console.log('Unknown node type', syntaxNode.type);
                syntaxNode = MISMATCH;
        }
    }

    // console.log(iterationCount);
    totalIterationCount += iterationCount;

    if (syntaxNode === MATCH) {
        while (syntaxStack) {
            closeSyntax();
        }

        return {
            tokens: tokens,
            match: matchStack,
            error: null
        };
    } else {
        tokenCursor = bestMatch.tokenCursor;
        moveToNextToken();

        for (var value = '', offset = 0, i = 0; i < tokens.length; i++) {
            var testToken = tokens[i];
            if (testToken === token) {
                offset = value.length;
            }
            value += testToken.value;
        }

        return {
            tokens: tokens,
            match: null,
            error: {
                token: token,
                value: value,
                offset: offset
            }
        };

    }
}

const astToTokenStream = {
    decorator: function(handlers) {
        var curNode = null;
        var tokens = [];

        return {
            children: handlers.children,
            node: function(node) {
                var tmp = curNode;
                curNode = node;
                handlers.node.call(this, node);
                curNode = tmp;
            },
            chunk: function(chunk) {
                tokens.push({
                    value: chunk,
                    node: curNode
                });
            },
            result: function() {
                return tokens;
            }
        };
    }
};

function match(ast, matchTree, syntaxes) {
    const tokens = csstree.generate(ast, astToTokenStream);

    // console.log(tokens);
    // process.exit();

    return internalMatch(tokens, matchTree, syntaxes || {});
}

function matchAsTree() {
    const matchResult = match.apply(this, arguments);

    if (matchResult.match === null) {
        return matchResult;
    }

    let cursor = matchResult.match;
    let host = matchResult.match = {
        syntax: null,
        match: []
    };
    const stack = [host];

    // revert a list
    let prev = null;
    let next = null;
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
        const entry = cursor;

        switch (entry.type) {
            case 'Open':
                host.match.push(host = {
                    syntax: entry.syntax,
                    match: []
                });
                stack.push(host);
                break;

            case 'Close':
                stack.pop();
                host = stack[stack.length - 1];
                break;

            default:
                host.match.push({
                    syntax: entry.syntax,
                    token: entry.token && entry.token.value,
                    node: entry.token && entry.token.node
                });
        }

        cursor = cursor.prev;
    }

    return matchResult;
}

// TODO: remove
process.on('exit', function() {
    console.log('TOTAL COUNT', totalIterationCount);
});

module.exports = {
    buildMatchTree: function(str) {
        id = 1; // TODO: remove
        const ast = csstree.grammar.parse(str);
        const matchTree = buildMatchTree(ast);
        matchTree.syntax = ast;
        return matchTree;
    },
    match: function() {
        const matchResult = match.apply(this, arguments);

        return {
            tokens: matchResult.tokens,
            result: matchResult.match !== null ? 'match' : 'mismatch',
            match: mapList(matchResult.match, 'prev', function(item) {
                if (item.type === 'Open' || item.type === 'Close') {
                    return { type: item.type, syntax: item.syntax };
                }
                return {
                    syntax: item.syntax,
                    token: item.token && item.token.value,
                    node: item.token && item.token.node
                };
            }).slice(1)
        };
    },
    matchAsTree
};
