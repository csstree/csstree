var List = require('../utils/list');
var names = require('../utils/names');

function skipSpaces(node) {
    while (node !== null && (node.data.type === 'Space' || node.data.type === 'Comment')) {
        node = node.next;
    }

    return node;
}

module.exports = function match(syntax, syntaxNode, node) {
    var result = [];
    var min = syntaxNode.min === 0 || syntaxNode.min ? syntaxNode.min : 1;
    var max = syntaxNode.max === null ? Infinity : (syntaxNode.max || 1);
    var lastCommaTermCount;
    var lastComma;
    var matchCount = 0;

    mismatch:
    while (matchCount < max) {
        node = skipSpaces(node);
        switch (syntaxNode.type) {
            case 'Sequence':
            case 'Group':
                next:
                switch (syntaxNode.combinator) {
                    case '|':
                        for (var i = 0; i < syntaxNode.terms.length; i++) {
                            var res = match(syntax, syntaxNode.terms[i], node);
                            if (res && res.match) {
                                result.push(res.match);
                                node = res.next;
                                break next;  // continue matching
                            }
                        }
                        break mismatch; // nothing found -> stop matching

                    case ' ':
                        var beforeMatchNode = node;
                        var lastMatchedTerm = null;
                        var hasTailMatch = false;
                        var commaMissed = false;
                        for (var i = 0; i < syntaxNode.terms.length; i++) {
                            var term = syntaxNode.terms[i];
                            var res = match(syntax, term, node);
                            if (res && res.match) {
                                if (term.type === 'Comma' && i !== 0 && !hasTailMatch) {
                                    // recover cursor to state before last match and stop matching
                                    node = beforeMatchNode;
                                    break mismatch;
                                }

                                // non-empty match
                                if (res.match.match.length) {
                                    // match should be preceded by a comma
                                    if (commaMissed) {
                                        node = beforeMatchNode;
                                        break mismatch;
                                    }

                                    hasTailMatch = term.type !== 'Comma';
                                    lastMatchedTerm = term;
                                }

                                result.push(res.match);
                                node = skipSpaces(res.next);
                            } else {
                                // it's ok when comma doesn't match when no matches yet
                                // but only if comma is not first or last term
                                if (term.type === 'Comma' && i !== 0 && i !== syntaxNode.terms.length - 1) {
                                    if (hasTailMatch) {
                                        commaMissed = true;
                                    }
                                    continue;
                                }

                                // recover cursor to state before last match and stop matching
                                node = beforeMatchNode;
                                break mismatch;
                            }
                        }

                        // don't allow empty match when [ ]!
                        if (!lastMatchedTerm && syntaxNode.nonEmpty) {
                            // empty match but shouldn't
                            // recover cursor to state before last match and stop matching
                            node = beforeMatchNode;
                            break mismatch;
                        }

                        // don't allow comma at the end but only if last term isn't a comma
                        if (lastMatchedTerm && lastMatchedTerm.type === 'Comma' && term.type !== 'Comma') {
                            node = beforeMatchNode;
                            break mismatch;
                        }

                        break;

                    case '&&':
                        var beforeMatchNode = node;
                        var lastMatchedTerm = null;
                        var terms = syntaxNode.terms.slice();

                        while (terms.length) {
                            var wasMatch = false;
                            var emptyMatched = 0;

                            for (var i = 0; i < terms.length; i++) {
                                var term = terms[i];
                                var res = match(syntax, term, node);
                                if (res && res.match) {
                                    // non-empty match
                                    if (res.match.match.length) {
                                        lastMatchedTerm = term;
                                    } else {
                                        emptyMatched++;
                                        continue;
                                    }

                                    wasMatch = true;
                                    terms.splice(i--, 1);
                                    result.push(res.match);
                                    node = skipSpaces(res.next);
                                    break;
                                }
                            }

                            if (!wasMatch) {
                                // terms left, but they all are optional
                                if (emptyMatched === terms.length) {
                                    break;
                                }

                                // not ok
                                node = beforeMatchNode;
                                break mismatch;
                            }
                        }

                        if (!lastMatchedTerm && syntaxNode.nonEmpty) { // don't allow empty match when [ ]!
                            // empty match but shouldn't
                            // recover cursor to state before last match and stop matching
                            node = beforeMatchNode;
                            break mismatch;
                        }

                        break;

                    case '||':
                        var beforeMatchNode = node;
                        var lastMatchedTerm = null;
                        var terms = syntaxNode.terms.slice();

                        while (terms.length) {
                            var wasMatch = false;
                            var emptyMatched = 0;

                            for (var i = 0; i < terms.length; i++) {
                                var term = terms[i];
                                var res = match(syntax, term, node);
                                if (res && res.match) {
                                    // non-empty match
                                    if (res.match.match.length) {
                                        lastMatchedTerm = term;
                                    } else {
                                        emptyMatched++;
                                        continue;
                                    }

                                    wasMatch = true;
                                    terms.splice(i--, 1);
                                    result.push(res.match);
                                    node = skipSpaces(res.next);
                                    break;
                                }
                            }

                            if (!wasMatch) {
                                break;
                            }
                        }

                        // don't allow empty match
                        if (!lastMatchedTerm && (emptyMatched !== terms.length || syntaxNode.nonEmpty)) {
                            // empty match but shouldn't
                            // recover cursor to state before last match and stop matching
                            node = beforeMatchNode;
                            break mismatch;
                        }

                        break;
                }

                break;

            case 'Type':
                var typeSyntax = syntax.getType(syntaxNode.name);
                if (!typeSyntax) {
                    throw new Error('Unknown syntax type `' + syntaxNode.name + '`');
                }

                var res = typeSyntax.match(node);
                if (!res || !res.match) {
                    break mismatch;
                }

                result.push(res.match);
                node = res.next;
                break;

            case 'Function':
                // expect a function node
                if (!node || node.data.type !== 'Function') {
                    break mismatch;
                }

                var keyword = names.keyword(node.data.name);
                var name = syntaxNode.name.toLowerCase();

                // check function name with vendor consideration
                if (name !== keyword.vendor + keyword.name) {
                    break mismatch;
                }

                // convert arguments into plain list for now, otherwise it's become too complicated to match
                var list = new List();
                if (node) {
                    node.data.arguments.each(function(argument) {
                        if (list.head) {
                            list.insert(list.createItem({
                                type: 'Operator',
                                info: null,
                                value: ','
                            }));
                        }

                        list.appendList(argument.sequence.copy());
                    });
                }

                var res = match(syntax, syntaxNode.sequence, list.head);
                if (!res || !res.match || res.next) {
                    break mismatch;
                }

                result.push(res.match);
                // Use node.next instead of res.next here since syntax is matching
                // for internal list and it's should be completelly matched (res.next is null at this point).
                // Therefore function is matched and we going to next node
                node = node.next;
                break;

            case 'Property':
                var propertySyntax = syntax.getProperty(syntaxNode.name);
                if (!propertySyntax) {
                    throw new Error('Unknown property `' + syntaxNode.name + '`');
                }

                var res = propertySyntax.match(node);
                if (!res || !res.match) {
                    break mismatch;
                }

                result.push(res.match);
                node = res.next;
                break;

            case 'Keyword':
                if (!node) {
                    break mismatch;
                }

                if (node.data.type === 'Identifier') {
                    var keyword = names.keyword(node.data.name);
                    var name = syntaxNode.name.toLowerCase();

                    if (name !== keyword.vendor + keyword.name) {
                        break mismatch;
                    }
                } else {
                    // keyword may to be a number (a.e. font-weight: 400 )
                    if (node.data.type !== 'Number' || node.data.value !== syntaxNode.name) {
                        break mismatch;
                    }
                }

                result.push(node.data);
                node = node.next;
                break;

            case 'Slash':
            case 'Comma':
                if (!node || node.data.type !== 'Operator' || node.data.value !== syntaxNode.value) {
                    break mismatch;
                }

                result.push(node.data);
                node = node.next;
                break;

            case 'String':
                if (!node || node.data.type !== 'String') {
                    break mismatch;
                }

                result.push(node.data);
                node = node.next;
                break;

            default:
                throw new Error('Not implemented yet node type: ' + syntaxNode.type);
        }

        matchCount++;
        if (!node) {
            break;
        }

        if (syntaxNode.comma) {
            if (lastComma && lastCommaTermCount === result.length) {
                // nothing match after comma
                break mismatch;
            }

            node = skipSpaces(node);
            if (node && node.data.type === 'Operator' && node.data.value === ',') {
                lastCommaTermCount = result.length;
                lastComma = node;
                node = node.next;
            } else {
                break mismatch;
            }
        }
    }

    if (lastComma && lastCommaTermCount === result.length) {
        // nothing match after comma
        node = lastComma;
    }

    return {
        next: node,
        match: matchCount < min ? null : {
            type: syntaxNode.type,
            name: syntaxNode.name,
            match: result
        }
    };
};
