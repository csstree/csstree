var assert = require('assert');
var { buildMatchTree, match } = require('./new-match');

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
    var syntaxes = { type: {} };

    if (test.syntaxes) {
        for (var name in test.syntaxes) {
            syntaxes.type[name] = buildMatchTree(test.syntaxes[name]);
        }
    }

    describe(syntax, function() {
        if (test.match) {
            test.match.forEach(function(input) {
                it('should MATCH to "' + input + '"', function() {
                    var m = match(input, matchTree, syntaxes);

                    assert.equal(
                        m.result,
                        'match'
                    );

                    assert.deepEqual(
                        m.match
                            .map(x => x.token)
                            .filter(x => x !== undefined),
                        m.tokens
                            .map(x => x.value)
                            .filter(s => /\S/.test(s))
                    );
                });
            });
        }

        if (test.mismatch) {
            test.mismatch.forEach(function(input) {
                it('should NOT MATCH to "' + input + '"', function() {
                    assert.equal(
                        match(input, matchTree, syntaxes).result,
                        'mismatch'
                    );
                });
            });
        }
    });
}

describe('basic', function() {
    for (var syntax in tests) {
        createSyntaxTest(syntax, tests[syntax]);
    }
});
