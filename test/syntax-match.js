var assert = require('assert');
var prepareTokens = require('../lib/lexer/prepare-tokens');
var genericSyntaxes = require('../lib/lexer/generic');
var buildMatchGraph = require('../lib/lexer/match-graph').buildMatchGraph;
var matchAsList = require('../lib/lexer/match').matchAsList;
var matchAsTree = require('../lib/lexer/match').matchAsTree;
var fixture = require('./fixture/syntax-match');

var equiv;
var tests = {
    'a b': {
        valid: [
            'a b'
        ],
        invalid: [
            '',
            'a',
            'b',
            'b a',
            'a b c'
        ]
    },
    'a | b': {
        valid: [
            'a',
            'b'
        ],
        invalid: [
            '',
            'x',
            'a b',
            'b a'
        ]
    },
    'a || b': {
        valid: [
            'a',
            'b',
            'a b',
            'b a'
        ],
        invalid: [
            '',
            'a x',
            'b x',
            'a b a'
        ]
    },
    'a || b || c || d || e || f': {
        valid: [
            'a',
            'b',
            'a b',
            'b a',
            'a b c d e f',
            'f e d c b a',
            'f d b a e c'
        ],
        invalid: [
            '',
            'a x',
            'a a a',
            'a b a',
            'a f f b',
            'f a f a',
            'f d b a e c x'
        ]
    },
    'a && b': {
        valid: [
            'a b',
            'b a'
        ],
        invalid: [
            '',
            'a',
            'b',
            'a x',
            'b x',
            'a b a'
        ]
    },
    'a && b && c && d && e && f': {
        valid: [
            'a b c d e f',
            'f e d c b a',
            'f d b a e c'
        ],
        invalid: [
            '',
            'a',
            'b',
            'a b d e f',
            'f e d c b a x',
            'a b c d e f a',
            'a b c d a f'
        ]
    },
    '[a || b] || c': {
        valid: [
            'a',
            'b',
            'c',
            'a b c',
            'b a c',
            'a b',
            'b a',
            'a c',
            'b c',
            'c a',
            'c b',
            'c a b',
            'c b a'
        ],
        invalid: [
            '',
            'c a c',
            'a c a'
        ]
    },
    '[a && b] || c': {
        valid: [
            'a b c',
            'b a c',
            'a b',
            'b a',
            'c',
            'c a b',
            'c b a'
        ],
        invalid: [
            '',
            'a c',
            'b c',
            'c a',
            'c b',
            'c a b b',
            'c x'
        ]
    },
    '[a b] | [b a]': {
        valid: [
            'a b',
            'b a'
        ],
        invalid: [
            '',
            'a',
            'b',
            'a x'
        ]
    },
    '[a] | [a && b]': {
        valid: [
            'a',
            'a b',
            'b a'
        ],
        invalid: [
            '',
            'a b c',
            'a b a'
        ]
    },
    '[a && b] | [a && b && c && d]': {
        valid: [
            'a b',
            'b a',
            'a b c d',
            'd c b a'
        ],
        invalid: [
            '',
            'a b c',
            'b c d',
            'a',
            'b',
            'c',
            'd'
        ]
    },

    // multipliers
    'a?': equiv = {
        valid: [
            '',
            'a'
        ],
        invalid: [
            'b',
            'a a',
            'a b'
        ]
    },
    'a{0,1}': equiv, // equavalent to a?
    'a*': equiv = {
        valid: [
            '',
            'a',
            'a a',
            'a a a',
            'a a a a a a'
        ],
        invalid: [
            'b',
            'a b',
            'a a a b'
        ]
    },
    'a{0,}': equiv, // equavalent to a*
    'a+': equiv = {
        valid: [
            'a',
            'a a',
            'a a a',
            'a a a a a a'
        ],
        invalid: [
            '',
            'b',
            'a b',
            'a a a b'
        ]
    },
    'a{1,}': equiv, // equavalent to a+
    'a{0,3}': {
        valid: [
            '',
            'a',
            'a a',
            'a a a'
        ],
        invalid: [
            'b',
            'a b',
            'a a a b',
            'a a a a a a'
        ]
    },
    'a{1,3}': {
        valid: [
            'a',
            'a a',
            'a a a'
        ],
        invalid: [
            '',
            'b',
            'a b',
            'a a a b',
            'a a a a a a'
        ]
    },
    'a{2,4}': {
        valid: [
            'a a',
            'a a a',
            'a a a a'
        ],
        invalid: [
            '',
            'a',
            'b',
            'a b',
            'a a a b',
            'a a a a a a'
        ]
    },
    'a{2}': equiv = {
        valid: [
            'a a'
        ],
        invalid: [
            '',
            'a',
            'b',
            'a b',
            'a a a',
            'a a b',
            'a a a a a'
        ]
    },
    'a{2,2}': equiv, // equavalent to a{2}
    'a{2,}': {
        valid: [
            'a a',
            'a a a',
            'a a a a',
            'a a a a a a a'
        ],
        invalid: [
            '',
            'a',
            'b',
            'a b',
            'a a a b'
        ]
    },
    'a#': {
        valid: [
            'a',
            'a, a',
            'a,a',
            'a, a, a, a'
        ],
        invalid: [
            '',
            'a a',
            'a, , a',
            'a, a a',
            'a, b',
            ', a',
            ',a',
            'a,',
            'a, '
        ]
    },
    'a#{2}': equiv = {
        valid: [
            'a, a',
            'a,a'
        ],
        invalid: [
            '',
            'a',
            'a,',
            ',a',
            'a,a,',
            ',a,a',
            'a, a, a',
            'a,a,a',
            'a, a, a, a'
        ]
    },
    'a#{2,2}': equiv, // equavalent to a#{2}
    'a#{2,4}': {
        valid: [
            'a, a',
            'a, a, a',
            'a, a, a, a'
        ],
        invalid: [
            '',
            'a',
            'a,',
            ',a',
            'a,a,',
            ',a,a',
            'a, a, a, a,',
            'a, a, a, a, a'
        ]
    },
    'a#{2,}': {
        valid: [
            'a, a',
            'a, a, a',
            'a, a, a, a, a, a'
        ],
        invalid: [
            '',
            'a',
            'a a'
        ]
    },
    'a#{1,4}, a': {
        valid: [
            'a, a',
            'a, a, a, a, a'
        ],
        invalid: [
            '',
            'a',
            'a, a, a, a, a, a'
        ]
    },
    'a#{1,2}, b': {
        valid: [
            'a, b',
            'a, a, b'
        ],
        invalid: [
            '',
            'a a, b',
            'b'
        ]
    },

    // not empty
    '[a? b? c?]!': {
        valid: [
            'a',
            'b',
            'c',
            'a b',
            'a c',
            'b c',
            'a b c'
        ],
        invalid: [
            '',
            'b a'
        ]
    },

    // comma
    'a, b': {
        valid: [
            'a, b'
        ],
        invalid: [
            '',
            'a b'
        ]
    },
    'a?, b': {
        valid: [
            'b',
            'a, b'
        ],
        invalid: [
            '',
            'a',
            ', b'
        ]
    },
    'a, b?': {
        valid: [
            'a',
            'a, b'
        ],
        invalid: [
            '',
            'a,',
            'b'
        ]
    },
    'a?, b?': {
        valid: [
            '',
            'a',
            'b',
            'a, b'
        ],
        invalid: [
            'a,',
            ',b',
            ','
        ]
    },
    '[a ,]* b': equiv = {
        valid: [
            'b',
            'a, b',
            'a, a, b'
        ],
        invalid: [
            '',
            'a b',
            'a, a b',
            ', b'
        ]
    },
    'a#{0,}, b': equiv, // equavalent to [a ,]* b,
    'a#, b?': {
        valid: [
            'a',
            'a, a',
            'a, b',
            'a, a, b'
        ],
        invalid: [
            '',
            'a,',
            'a, a,',
            ', b',
            'a a',
            'a b',
            'a a, b'
        ]
    },
    'a, b?, c': {
        valid: [
            'a, c',
            'a, b, c'
        ],
        invalid: [
            '',
            'a',
            'a,,c',
            'a,',
            ',c',
            'a c',
            'c'
        ]
    },
    'a? [, b]*': {
        valid: [
            '',
            'a',
            'a, b, b'
        ],
        invalid: [
            ', b',
            ', b, b'
        ]
    },
    '(a? [, b]*)': {
        valid: [
            '()',
            '(a)',
            '(b)',
            '(b, b)',
            '(a, b, b)'
        ],
        invalid: [
            '(, b)',
            '(, b, b)'
        ]
    },
    '([a ,]* b?)': {
        valid: [
            '()',
            '(a)',
            '(b)',
            '(a, a)',
            '(a, a, b)'
        ],
        invalid: [
            '(a, )',
            '(a, a, )',
            '(, b)'
        ]
    },
    'a / [b?, c?]': {
        valid: [
            'a /',
            'a / b',
            'a / c',
            'a / b, c'
        ],
        invalid: [
            '',
            'a / , c',
            'a / b ,'
        ]
    },
    '[a?, b?] / c': {
        valid: [
            '/ c',
            'a / c',
            'b / c',
            'a , b / c'
        ],
        invalid: [
            '',
            'a , / c',
            ', b / c'
        ]
    },
    'func( [a?, b?] )': {
        valid: [
            'func()',
            'func(a)',
            'func(b)',
            'func(a, b)'
        ],
        invalid: [
            '',
            'func(a,)',
            'func(,b)'
        ]
    },
    '[ foo? ]#': {
        valid: [
            'foo',
            'foo, foo',
            'foo, foo, foo, foo'
        ],
        invalid: [
            '',
            ',',
            ', foo',
            'foo, ',
            'foo foo'
        ]
    },

    // complex cases
    '[ [ left | center | right | top | bottom | <length> ] | [ left | center | right | <length> ] [ top | center | bottom | <length> ] | [ center | [ left | right ] <length>? ] && [ center | [ top | bottom ] <length>? ] ]': {
        types: {
            'length': 'length'
        },
        valid: [
            'center',
            'left top',
            'length length',
            'left length',
            'left length bottom length',
            'left length top'
        ],
        invalid: [
            'left left',
            'left length right',
            'center length left'
        ]
    },
    'rgb( <percentage>{3} [ / <alpha-value> ]? ) | rgb( <number>{3} [ / <alpha-value> ]? ) | rgb( <percentage>#{3} , <alpha-value>? ) | rgb( <number>#{3} , <alpha-value>? )': {
        types: {
            'alpha-value': '<number [0,1]>'
        },
        valid: [
            'rgb(1, 2, 3)',
            'rgb(1, 2, 3, 1)',
            'rgb(1%, 2%, 3%)',
            'rgb(1%, 2%, 3%, 1)',
            'rgb(1 2 3)',
            'rgb(1 2 3 / 1)',
            'rgb(1% 2% 3%)',
            'rgb(1% 2% 3% / 1)'
        ],
        invalid: [
            'rgb(1, 2 3)',
            'rgb(1, 2, 3%)',
            'rgb(1, 2, 3, 4)'
        ]
    },
    '<custom-ident>+ from': {
        valid: [
            'a from',
            'a b from',
            'a b c d from',
            'from from',
            'from from from'
        ],
        invalid: [
            '',
            'a',
            'a b',
            'from'
        ]
    },
    'a <foo> b': {
        types: {
            foo: '<custom-ident>*'
        },
        valid: [
            'a b',
            'a x b',
            'a b b b'
        ],
        invalid: [
            '',
            'a b c'
        ]
    },
    'a? <bar> / c': {
        types: {
            bar: '<foo>?',
            foo: '<custom-ident>+'
        },
        valid: [
            '/ c',
            'b b / c',
            'a a / c',
            'a / c',
            'a b / c',
            'a b b b / c'
        ],
        invalid: [
            '',
            'a',
            'a a a'
        ]
    },

    // function
    'a( b* )': {
        valid: [
            'a()',
            'A()',
            'a(b)',
            'a( b b b )'
        ],
        invalid: [
            '',
            'a',
            'A',
            // 'a(', // FIXME: csstree parser normalizes it to `a()`
            'a ()',
            'a (b)',
            'a(x)',
            'a(())'
        ]
    },
    '[ a( | b( ] c )': {
        valid: [
            'a(c)',
            'b(c)'
        ],
        invalid: [
            '',
            'a(b(c))'
        ]
    },

    // parentheses
    'a ( b* ) c': {
        valid: [
            'a () c',
            'a (b) c',
            'a (b b b)c'
        ],
        invalid: [
            // 'a()c' // FIXME: should differ from a function
        ]
    },

    // string
    '\'[\' <custom-ident> \']\'': {
        valid: [
            '[foo]',
            '[ foo ]'
        ],
        invalid: [
            'foo',
            '[]'
        ]
    },
    '\'progid:\' <ident>': {
        valid: [
            'progid:foo',
            'progid: foo'
        ],
        invalid: [
            'progid:',
            'progid :foo',
            'progid : foo',
            'prog id:foo',
            'foo'
        ]
    }
};

function processMatchResult(mr) {
    if (Array.isArray(mr)) {
        var array = mr.map(processMatchResult);
        return array.length === 1 ? array[0] : array;
    }

    if (mr.token) {
        return mr.token;
    }

    if (mr.syntax && mr.match) {
        return {
            syntax: mr.syntax.type === 'Type'
                ? '<' + mr.syntax.name + '>'
                : mr.syntax.type === 'Property'
                    ? '<\'' + mr.syntax.name + '\'>'
                    : mr.syntax.name,
            match: processMatchResult(mr.match)
        };
    }
}

function createSyntaxTest(testName, test) {
    var syntax = test.syntax || testName;
    var matchTree = buildMatchGraph(syntax);
    var syntaxes = { types: {}, properties: {} };

    for (var name in genericSyntaxes) {
        syntaxes.types[name] = {
            match: buildMatchGraph(genericSyntaxes[name])
        };
    }

    if (test.types) {
        for (var name in test.types) {
            syntaxes.types[name] = {
                match: buildMatchGraph(test.types[name])
            };
        }
    }

    if (test.properties) {
        for (var name in test.properties) {
            syntaxes.properties[name] = {
                match: buildMatchGraph(test.properties[name])
            };
        }
    }

    (describe[test.test] || describe)(test.name || testName, function() {
        if (test.valid) {
            test.valid.forEach(function(input) {
                it('should MATCH to "' + input + '"', function() {
                    var m = matchAsList(prepareTokens(input), matchTree, syntaxes);

                    assert.notEqual(m.match, null);

                    assert.deepEqual(
                        m.match
                            .map(function(x) {
                                return x.token;
                            })
                            .filter(function(x) {
                                return x !== undefined;
                            }),
                        m.tokens
                            .map(function(x) {
                                return x.value;
                            })
                            .filter(function(s) {
                                return /\S/.test(s);
                            })
                    );
                });
            });
        }

        if (test.invalid) {
            test.invalid.forEach(function(input) {
                it('should NOT MATCH to "' + input + '"', function() {
                    var m = matchAsList(prepareTokens(input), matchTree, syntaxes);

                    assert.equal(m.match, null);
                });
            });
        }

        if (test.matchResult) {
            Object.keys(test.matchResult).forEach(function(input) {
                var matchResult = test.matchResult[input];

                it('match result for "' + input + '"', function() {
                    var m = matchAsTree(prepareTokens(input), matchTree, syntaxes);
                    // console.log(JSON.stringify(processMatchResult(m.match.match), null, 4));

                    assert.deepEqual(processMatchResult(m.match.match), matchResult);
                });
            });
        }
    });
}

describe('syntax matching', function() {
    for (var syntax in tests) {
        createSyntaxTest(syntax, tests[syntax]);
    }

    fixture.forEachTest(createSyntaxTest);

    it('should raise an error on broken type reference', function() {
        var matchTree = buildMatchGraph('<foo>');

        assert.throws(function() {
            matchAsList(prepareTokens('foo'), matchTree, {});
        }, /Bad syntax reference: <foo>/);
    });

    it('should raise an error on broken property reference', function() {
        var matchTree = buildMatchGraph('<\'foo\'>');

        assert.throws(function() {
            matchAsList(prepareTokens('foo'), matchTree, {});
        }, /Bad syntax reference: <\'foo\'>/);
    });
});
