'use strict';

var generate = require('../generator'); // FIXME: should be used outside
var matchTree = require('./match-tree');
var MATCH = matchTree.MATCH;
var MISMATCH = matchTree.MISMATCH;
var DISALLOW_EMPTY = matchTree.DISALLOW_EMPTY;

var hasOwnProperty = Object.prototype.hasOwnProperty;
var totalIterationCount = 0;

function mapList(list, ref, fn) {
    var result = [];

    while (list) {
        result.unshift(fn(list));
        list = list[ref];
    }

    return result;
}

function internalMatch(tokens, syntax, syntaxes) {
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

        return matchToken;
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

    var LIMIT = 20000;
    var iterationCount = 0;
    // var x = syntaxNode;

    while (true) {
        // console.log('--\n',
        //     '#' + iterationCount,
        //     require('util').inspect({
        //         match: mapList(matchStack, 'prev', x => x.type === 'Token' ? x.token && x.token.value : x.syntax ? x.type + '!' + x.syntax.name : null),
        //         alternative: mapList(alternative, 'alt', x => x.id),
        //         ifStack: mapList(ifStack, 'prev', x => x.id),
        //         token: token && token.value,
        //         tokenCursor,
        //         syntaxNode
        //     }, { depth: null })
        // );

        // prevent infinite loop
        if (++iterationCount === LIMIT) {
            console.error('BREAK after ' + LIMIT + ' steps');
            // console.log(x);
            // console.log(require('./grammar/generate')(x.syntax));
            // console.log(tokens.map(function(x) {
            //     return x.value;
            // }).join(''));
            // x = 1;
            // process.exit();
            syntaxNode = MISMATCH;
            break;
        }

        if (syntaxNode === MATCH) {
            if (ifStack === null) {
                // turn to MISMATCH when some tokens left unmatched
                if (token !== null) {
                    // doesn't mismatch if just one token left and it's an IE hack
                    if (tokenCursor !== tokens.length - 1 || (token.value !== '\\0' && token.value !== '\\9')) {
                        syntaxNode = MISMATCH;
                        continue;
                    }
                }

                // break the main loop, return a result - MATCH
                break;
            }

            // go to `then` branch
            syntaxNode = ifStack.then;

            // check match is not empty
            if (syntaxNode === DISALLOW_EMPTY) {
                if (ifStack.matchStack.token === matchStack.token) {
                    syntaxNode = MISMATCH;
                    continue;
                } else {
                    syntaxNode = MATCH;
                }
            }

            // close syntax if needed
            if (syntaxStack !== null && ifStack.syntaxStack !== syntaxStack) {
                closeSyntax();
            }

            // save if stack top as an alternative for future
            if (alternative === null || alternative.matchStack.size <= ifStack.matchStack.size) {
                ifStack.alt = alternative;
                alternative = ifStack;
            }

            // pop stack
            ifStack = ifStack.prev;
            continue;
        }

        if (syntaxNode === MISMATCH) {
            if (ifStack === null) {
                // try alternative match if any
                if (alternative === null) {
                    // break the main loop, return a result - MISMATCH
                    break;
                }

                ifStack = alternative;
                alternative = alternative.alt;
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
                    id: syntaxNode.id,
                    then: syntaxNode.then,
                    else: syntaxNode.else,
                    matchStack: matchStack,
                    syntaxStack: syntaxStack,
                    prev: ifStack,
                    alt: null
                };

                syntaxNode = syntaxNode.match;

                break;

            case 'Type':
            case 'Property':
                openSyntax();

                var syntaxDict = syntaxNode.type === 'Type' ? 'types' : 'properties';
                if (hasOwnProperty.call(syntaxes, syntaxDict) && syntaxes[syntaxDict][syntaxNode.name]) {
                    syntaxNode = syntaxes[syntaxDict][syntaxNode.name].match;
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
                var name = syntaxNode.name;

                syntaxNode = MISMATCH;

                if (token !== null) {
                    var keywordName = token.value;

                    // drop \0 and \9 hack from keyword name
                    if (keywordName.indexOf('\\') !== -1) {
                        keywordName = keywordName.replace(/\\[09].*$/, '');
                    }

                    if (keywordName.toLowerCase() === name) {
                        addTokenToStack();
                        syntaxNode = MATCH;
                    }
                }

                break;

            case 'Enum':
                var name = token !== null ? token.value.toLowerCase() : '';

                // drop \0 and \9 hack from keyword name
                if (name.indexOf('\\') !== -1) {
                    name = name.replace(/\\[09].*$/, '');
                }

                if (hasOwnProperty.call(syntaxNode.map, name)) {
                    syntaxNode = syntaxNode.map[name];
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
            // TODO: strings with length other than 1 char

            default:
                console.log('Unknown node type:', syntaxNode.type, syntaxNode);
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
            iterations: iterationCount,
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

        // if (x === 1) {
        //     console.log([value, '-'.repeat(offset - 1) + '^'].join('\n'));
        // }

        return {
            tokens: tokens,
            iterations: iterationCount,
            match: null,
            error: {
                token: token,
                value: value,
                offset: offset
            }
        };

    }
}

var astToTokenStream = {
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
    // console.log(generate(ast), require('util').inspect(matchTree));
    var tokens = generate(ast, astToTokenStream);

    // console.log(tokens);
    // process.exit();

    return internalMatch(tokens, matchTree, syntaxes || {});
}

function matchAsList() {
    var matchResult = match.apply(this, arguments);

    if (matchResult.match !== null) {
        matchResult.match = mapList(matchResult.match, 'prev', function(item) {
            if (item.type === 'Open' || item.type === 'Close') {
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

function matchAsTree(ast, matchTree) {
    var matchResult = match.apply(this, arguments);

    if (matchResult.match === null) {
        return matchResult;
    }

    var cursor = matchResult.match;
    var host = matchResult.match = {
        syntax: matchTree.syntax || null,
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

module.exports = {
    matchAsList: matchAsList,
    matchAsTree: matchAsTree,
    getTotalIterationCount: function() {
        return totalIterationCount;
    }
};
