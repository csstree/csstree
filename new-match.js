const csstree = require('./lib');

const MATCH = 'match';
const MISMATCH = 'mismatch';
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

function buildGroupMatchTree(node, atLeastOneTermMatched) {
    switch (node.combinator) {
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

            for (var i = node.terms.length - 1; i >= 0; i--) {
                result = createCondition(
                    buildMatchTree(node.terms[i]),
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

            for (var i = node.terms.length - 1; i >= 0; i--) {
                result = createCondition(
                    buildMatchTree(node.terms[i]),
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

            for (var i = node.terms.length - 1; i >= 0; i--) {
                var term = node.terms[i];
                var thenClause;

                if (node.terms.length > 1) {
                    thenClause = buildGroupMatchTree({
                        type: 'Group',
                        terms: node.terms.filter(function(newGroupTerm) {
                            return newGroupTerm !== term;
                        }),
                        combinator: node.combinator,
                        disallowEmpty: false
                    });
                } else {
                    thenClause = MATCH;
                }

                result = createCondition(
                    buildMatchTree(term),
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

            for (var i = node.terms.length - 1; i >= 0; i--) {
                var term = node.terms[i];
                var thenClause;

                if (node.terms.length > 1) {
                    thenClause = buildGroupMatchTree({
                        type: 'Group',
                        terms: node.terms.filter(function(newGroupTerm) {
                            return newGroupTerm !== term;
                        }),
                        combinator: node.combinator,
                        disallowEmpty: false
                    }, true);
                } else {
                    thenClause = MATCH;
                }

                result = createCondition(
                    buildMatchTree(term),
                    thenClause,
                    result
                );
            };

            return result;
    }
}

function buildMatchTree(node) {
    switch (node.type) {
        case 'Group':
            return buildGroupMatchTree(node);

        case 'Multiplier':
            var matchTerm = buildMatchTree(node.term);
            var result = MATCH;
            // console.log(node);

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
                        { type: 'Comma' },
                        result,
                        MISMATCH
                    );
                }
            } else {
                // create a match node chain for [min .. max] interval with optional matches
                for (var i = node.min || 1; i <= node.max; i++) {
                    if (node.comma && result !== MATCH) {
                        result = createCondition(
                            { type: 'Comma' },
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
                            { type: 'Comma' },
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

        case 'Function':
            return {
                type: 'Function',
                name: node.name,
                children: node.children.map(buildMatchTree)
            };

        case 'Parentheses':
            return {
                type: 'Parentheses',
                children: node.children.map(buildMatchTree)
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

function internalMatch(ast, syntax) {
    function nextNode() {
        do {
            tokenCursor++;
            token = tokenCursor < ast.length ? ast[tokenCursor] : null;
        } while (token !== null && !/\S/.test(token.value));

        return token;
    }

    function matchNode() {
        matchStack = {
            size: matchStack.size + 1,
            syntax: syntaxNode,
            token: token,
            tokenCursor: tokenCursor,
            prev: matchStack
        };

        nextNode();
    }

    let matchStack = { size: 0, syntax: null, token: null, prev: null };
    var tokenCursor = -1;
    var token = nextNode();

    var ifStack = null;
    var alternative = null;
    var syntaxNode = syntax;

    var result;
    var LIMIT = 5000;
    var iterationCount = 0;

    while (syntaxNode) {
        // console.log('--\n', '#' + iterationCount, mapList(matchStack, 'prev', x => x.token), JSON.stringify(token), tokenCursor);
        // console.log(syntaxNode);

        // prevent infinite loop
        if (++iterationCount === LIMIT) {
            console.log(`BREAK after ${LIMIT} steps`);
            break;
        }

        if (syntaxNode === MATCH || syntaxNode === MISMATCH) {
            if (ifStack === null) {
                // console.log('matchStack', ifStack);
                // console.log('token', token);

                // turn to MISMATCH when some tokens left unmatched
                if (token !== null) {
                    syntaxNode = MISMATCH;
                }

                // try alternative match if any
                if (syntaxNode === MISMATCH && alternative !== null) {
                    ifStack = alternative;
                    alternative = alternative.alt;
                    continue;
                }

                // match or mismatch with no any alternative, return a result
                result = syntaxNode;
                break;
            }

            // fast forward match when possible
            if (syntaxNode === MATCH && ifStack.fastForwardMatch) {
                if (token !== null) {
                    syntaxNode = MISMATCH;
                } else {
                    result = MATCH;
                    break;
                }
            }

            // split
            if (syntaxNode === MATCH) {
                syntaxNode = ifStack.then;

                // save if stack top as alternative for future
                if (alternative === null || alternative.matchStack.size <= ifStack.matchStack.size) {
                    ifStack.alt = alternative;
                    alternative = ifStack;
                }
            } else {
                syntaxNode = ifStack.else;

                // restore match stack state
                matchStack = ifStack.matchStack;
                tokenCursor = matchStack.size === 0 ? -1 : matchStack.tokenCursor;
                token = nextNode();
            }

            // console.log('trans:', ifStack.id, '=>', ifStack.next && ifStack.next.id);
            // pop stack
            ifStack = ifStack.next;
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
                    next: ifStack,
                    fastForwardMatch: syntaxNode.then === MATCH && (ifStack === null || ifStack.fastForwardMatch),
                    alt: null
                };

                syntaxNode = syntaxNode.match;

                break;

            case 'Keyword':
                if (token !== null && token.value === syntaxNode.name) {
                    matchNode();
                    syntaxNode = MATCH;
                } else {
                    syntaxNode = MISMATCH;
                }

                break;

            case 'Type':
                if (token !== null && syntaxNode.name === 'custom-ident') {
                    matchNode();
                    syntaxNode = MATCH;
                } else {
                    syntaxNode = MISMATCH;
                }

                break;

            case 'Comma':
                if (token !== null && token.value === ',') {
                    matchNode();
                    syntaxNode = MATCH;
                } else {
                    syntaxNode = MISMATCH;
                }

                break;

            // case 'Function':
            // case 'Parentheses':
            // case 'Type':
            // case 'Property':
            // case 'Slash':
            // case 'Comma':
            // case 'String':
            default:
                console.log('Unknown node type', syntaxNode.type);
                syntaxNode = MISMATCH;
        }

        // console.log('next:', syntaxNode);
    }

    console.log(iterationCount);
    totalIterationCount += iterationCount;

    return {
        result,
        match: mapList(matchStack, 'prev', function(item) {
            return {
                syntax: item.syntax,
                token: item.token && item.token.value,
                node: item.token && item.token.node
            };
        }).slice(1)
    };
}

function match(input, matchTree) {
    const ast = csstree.parse(input, { context: 'value' });
    const tokens = csstree.generate(ast, {
        decorator: function(handlers) {
            var curNode = null;
            var tokens = [];

            var handlersNode = handlers.node;
            handlers.node = function(node) {
                var tmp = curNode;
                curNode = node;
                handlersNode.call(this, node);
                curNode = tmp;
            };

            handlers.chunk = function(chunk) {
                tokens.push({
                    value: chunk,
                    node: curNode
                });
            };

            handlers.result = function() {
                return tokens;
            };

            return handlers;
        }
    });
    // console.log(tokens);
    // process.exit();

    const result = internalMatch(tokens, matchTree);

    return Object.assign({ tokens }, result);
}

// TODO: remove
process.on('exit', function() {
    console.log('TOTAL COUNT', totalIterationCount);
});

module.exports = {
    buildMatchTree: function(str) {
        const ast = csstree.grammar.parse(str);
        id = 1; // TODO: remove
        return buildMatchTree(ast);
    },
    match: match
};
