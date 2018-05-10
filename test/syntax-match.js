var assert = require('assert');
var csstree = require('../lib');
var genericSyntaxes = require('../lib/lexer/generic');
var buildMatchTree = require('../lib/lexer/match-tree').buildMatchTree;
var matchAsList = require('../lib/lexer/match').matchAsList;

var equiv;
var tests = {
    'a || b': {
        match: [
            'a',
            'b',
            'a b',
            'b a'
        ],
        mismatch: [
            '',
            'a x',
            'b x',
            'a b a'
        ]
    },
    'a && b': {
        match: [
            'a b',
            'b a'
        ],
        mismatch: [
            '',
            'a',
            'b',
            'a x',
            'b x',
            'a b a'
        ]
    },
    'a b': {
        match: [
            'a b'
        ],
        mismatch: [
            '',
            'a',
            'b',
            'b a',
            'a b c'
        ]
    },
    'a | b': {
        match: [
            'a',
            'b'
        ],
        mismatch: [
            '',
            'x',
            'a b',
            'b a'
        ]
    },
    '[a || b] || c': {
        match: [
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
        mismatch: [
            '',
            'c a c',
            'a c a'
        ]
    },
    '[a && b] || c': {
        match: [
            'a b c',
            'b a c',
            'a b',
            'b a',
            'c',
            'c a b',
            'c b a'
        ],
        mismatch: [
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
        match: [
            'a b',
            'b a'
        ],
        mismatch: [
            '',
            'a',
            'b',
            'a x'
        ]
    },
    '[a] | [a && b]': {
        match: [
            'a',
            'a b',
            'b a'
        ],
        mismatch: [
            '',
            'a b c',
            'a b a'
        ]
    },
    '[a && b] | [a && b && c && d]': {
        match: [
            'a b',
            'b a',
            'a b c d',
            'd c b a'
        ],
        mismatch: [
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
        match: [
            '',
            'a'
        ],
        mismatch: [
            'b',
            'a a',
            'a b'
        ]
    },
    'a{0,1}': equiv, // equavalent to a?
    'a*': equiv = {
        match: [
            '',
            'a',
            'a a',
            'a a a',
            'a a a a a a'
        ],
        mismatch: [
            'b',
            'a b',
            'a a a b'
        ]
    },
    'a{0,}': equiv, // equavalent to a*
    'a+': equiv = {
        match: [
            'a',
            'a a',
            'a a a',
            'a a a a a a'
        ],
        mismatch: [
            '',
            'b',
            'a b',
            'a a a b'
        ]
    },
    'a{1,}': equiv, // equavalent to a+
    'a{0,3}': {
        match: [
            '',
            'a',
            'a a',
            'a a a'
        ],
        mismatch: [
            'b',
            'a b',
            'a a a b',
            'a a a a a a'
        ]
    },
    'a{1,3}': {
        match: [
            'a',
            'a a',
            'a a a'
        ],
        mismatch: [
            '',
            'b',
            'a b',
            'a a a b',
            'a a a a a a'
        ]
    },
    'a{2,4}': {
        match: [
            'a a',
            'a a a',
            'a a a a'
        ],
        mismatch: [
            '',
            'a',
            'b',
            'a b',
            'a a a b',
            'a a a a a a'
        ]
    },
    'a{2}': equiv = {
        match: [
            'a a'
        ],
        mismatch: [
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
        match: [
            'a a',
            'a a a',
            'a a a a',
            'a a a a a a a'
        ],
        mismatch: [
            '',
            'a',
            'b',
            'a b',
            'a a a b'
        ]
    },
    'a#': {
        match: [
            'a',
            'a, a',
            'a,a',
            'a, a, a, a'
        ],
        mismatch: [
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
        match: [
            'a, a',
            'a,a'
        ],
        mismatch: [
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
        match: [
            'a, a',
            'a, a, a',
            'a, a, a, a'
        ],
        mismatch: [
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
        match: [
            'a, a',
            'a, a, a',
            'a, a, a, a, a, a'
        ],
        mismatch: [
            '',
            'a',
            'a a'
        ]
    },
    'a#{1,4}, a': {
        match: [
            'a, a',
            'a, a, a, a, a'
        ],
        mismatch: [
            '',
            'a',
            'a, a, a, a, a, a'
        ]
    },
    'a#{1,2}, b': {
        match: [
            'a, b',
            'a, a, b'
        ],
        mismatch: [
            '',
            'a a, b',
            'b'
        ]
    },

    // not empty
    '[a? b? c?]!': {
        match: [
            'a',
            'b',
            'c',
            'a b',
            'a c',
            'b c',
            'a b c'
        ],
        mismatch: [
            '',
            'b a'
        ]
    },

    // comma
    'a, b': {
        match: [
            'a, b'
        ],
        mismatch: [
            '',
            'a b'
        ]
    },
    'a?, b': {
        match: [
            'b',
            'a, b'
        ],
        mismatch: [
            '',
            'a',
            ', b'
        ]
    },
    'a, b?': {
        match: [
            'a',
            'a, b'
        ],
        mismatch: [
            '',
            'a,',
            'b'
        ]
    },
    'a?, b?': {
        match: [
            '',
            'a',
            'b',
            'a, b'
        ],
        mismatch: [
            'a,',
            ',b',
            ','
        ]
    },
    '[a ,]* b': equiv = {
        match: [
            'b',
            'a, b',
            'a, a, b'
        ],
        mismatch: [
            '',
            'a b',
            'a, a b',
            ', b'
        ]
    },
    'a#{0,}, b': equiv, // equavalent to [a ,]* b,
    'a#, b?': {
        match: [
            'a',
            'a, a',
            'a, b',
            'a, a, b'
        ],
        mismatch: [
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
        match: [
            'a, c',
            'a, b, c'
        ],
        mismatch: [
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
        match: [
            '',
            'a',
            'a, b, b'
        ],
        mismatch: [
            ', b',
            ', b, b'
        ]
    },
    '(a? [, b]*)': {
        match: [
            '()',
            '(a)',
            '(b)',
            '(b, b)',
            '(a, b, b)'
        ],
        mismatch: [
            '(, b)',
            '(, b, b)'
        ]
    },
    '([a ,]* b?)': {
        match: [
            '()',
            '(a)',
            '(b)',
            '(a, a)',
            '(a, a, b)'
        ],
        mismatch: [
            '(a, )',
            '(a, a, )',
            '(, b)'
        ]
    },
    'a / [b?, c?]': {
        match: [
            'a /',
            'a / b',
            'a / c',
            'a / b, c'
        ],
        mismatch: [
            '',
            'a / , c',
            'a / b ,'
        ]
    },
    '[a?, b?] / c': {
        match: [
            '/ c',
            'a / c',
            'b / c',
            'a , b / c'
        ],
        mismatch: [
            '',
            'a , / c',
            ', b / c'
        ]
    },
    'func( [a?, b?] )': {
        match: [
            'func()',
            'func(a)',
            'func(b)',
            'func(a, b)'
        ],
        mismatch: [
            '',
            'func(a,)',
            'func(,b)'
        ]
    },

    // complex cases
    '[ [ left | center | right | top | bottom | <length> ] | [ left | center | right | <length> ] [ top | center | bottom | <length> ] | [ center | [ left | right ] <length>? ] && [ center | [ top | bottom ] <length>? ] ]': {
        syntaxes: {
            'length': 'length'
        },
        match: [
            'center',
            'left top',
            'length length',
            'left length',
            'left length bottom length',
            'left length top'
        ],
        mismatch: [
            'left left',
            'left length right',
            'center length left'
        ]
    },

    'rgb( <percentage>{3} [ / <alpha-value> ]? ) | rgb( <number>{3} [ / <alpha-value> ]? ) | rgb( <percentage>#{3} , <alpha-value>? ) | rgb( <number>#{3} , <alpha-value>? )': {
        syntaxes: {
            'alpha-value': '<number-zero-one>'
        },
        match: [
            'rgb(1, 2, 3)',
            'rgb(1, 2, 3, 1)',
            'rgb(1%, 2%, 3%)',
            'rgb(1%, 2%, 3%, 1)',
            'rgb(1 2 3)',
            'rgb(1 2 3 / 1)',
            'rgb(1% 2% 3%)',
            'rgb(1% 2% 3% / 1)'
        ],
        mismatch: [
            'rgb(1, 2 3)',
            'rgb(1, 2, 3%)',
            'rgb(1, 2, 3, 4)'
        ]
    },

    '<custom-ident>+ from': {
        match: [
            'a from',
            'a b from',
            'a b c d from',
            'from from',
            'from from from'
        ],
        mismatch: [
            '',
            'a',
            'a b',
            'from'
        ]
    },
    'a <foo> b': {
        syntaxes: {
            foo: '<custom-ident>*'
        },
        match: [
            'a b',
            'a x b',
            'a b b b'
        ],
        mismatch: [
            '',
            'a b c'
        ]
    },
    'a? <bar> / c': {
        syntaxes: {
            bar: '<foo>?',
            foo: '<custom-ident>+'
        },
        match: [
            '/ c',
            'b b / c',
            'a a / c',
            'a / c',
            'a b / c',
            'a b b b / c'
        ],
        mismatch: [
            '',
            'a',
            'a a a'
        ]
    },

    // function
    'a( b* )': {
        match: [
            'a()',
            'A()',
            'a(b)',
            'a( b b b )'
        ],
        mismatch: [
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
        match: [
            'a(c)',
            'b(c)'
        ],
        mismatch: [
            '',
            'a(b(c))'
        ]
    },

    // parentheses
    'a ( b* ) c': {
        match: [
            'a () c',
            'a (b) c',
            'a (b b b)c'
        ],
        mismatch: [
            // 'a()c' // FIXME: should differ from a function
        ]
    }
};

function createSyntaxTest(syntax, test) {
    var matchTree = buildMatchTree(syntax);
    var syntaxes = { types: {} };

    for (var name in genericSyntaxes) {
        syntaxes.types[name] = {
            match: {
                type: 'Generic',
                fn: genericSyntaxes[name]
            }
        };
    }

    if (test.syntaxes) {
        for (var name in test.syntaxes) {
            syntaxes.types[name] = {
                match: buildMatchTree(test.syntaxes[name])
            };
        }
    }

    describe(syntax, function() {
        if (test.match) {
            test.match.forEach(function(input) {
                it('should MATCH to "' + input + '"', function() {
                    var ast = csstree.parse(input, { context: 'value' });
                    var m = matchAsList(ast, matchTree, syntaxes);

                    assert.notEqual(m.match, null);
                    assert.equal(m.error, null);

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

        if (test.mismatch) {
            test.mismatch.forEach(function(input) {
                it('should NOT MATCH to "' + input + '"', function() {
                    var ast = csstree.parse(input, { context: 'value' });
                    var m = matchAsList(ast, matchTree, syntaxes);

                    assert.equal(m.match, null);
                    assert.notEqual(m.error, null);
                });
            });
        }
    });
}

describe('syntax matching', function() {
    for (var syntax in tests) {
        createSyntaxTest(syntax, tests[syntax]);
    }
});
