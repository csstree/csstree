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
    // 'a, b': {
    //     match: [
    //         'a, b'
    //     ],
    //     mismatch: [
    //         '',
    //         'a b'
    //     ]
    // },
    // 'a?, b': {
    //     match: [
    //         'b',
    //         'a, b'
    //     ],
    //     mismatch: [
    //         '',
    //         'a',
    //         ', b'
    //     ]
    // },
    // 'a, b?': {
    //     match: [
    //         'a',
    //         'a, b'
    //     ],
    //     mismatch: [
    //         '',
    //         'a,',
    //         'b'
    //     ]
    // },
    // 'a?, b?': {
    //     match: [
    //         '',
    //         'a',
    //         'b',
    //         'a, b'
    //     ],
    //     mismatch: [
    //         'a,',
    //         ',b',
    //         ','
    //     ]
    // },
    // '[a ,]* b': equiv = {
    //     match: [
    //         'b',
    //         'a, b',
    //         'a, a, b'
    //     ],
    //     mismatch: [
    //         '',
    //         'a b',
    //         'a, a b',
    //         ', b'
    //     ]
    // },
    // 'a#{0,}, b': equiv, // equavalent to [a ,]* b,
    // 'a#, b?': {
    //     match: [
    //         '',
    //         'a',
    //         'a, a',
    //         'a, b',
    //         'a, a, b'
    //     ],
    //     mismatch: [
    //         'a',
    //         'a,',
    //         'a, a,',
    //         ', b',
    //         'a a',
    //         'a b',
    //         'a a, b'
    //     ]
    // },

    // complex cases
    '[ [ left | center | right | top | bottom | lp ] | [ left | center | right | lp ] [ top | center | bottom | lp ] | [ center | [ left | right ] lp? ] && [ center | [ top | bottom ] lp? ] ]': {
        match: [
            'center',
            'left top',
            'lp lp',
            'left lp',
            'left lp bottom lp',
            'left lp top'
        ],
        mismatch: [
            'left left',
            'left lp right',
            'center lp left'
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
    }
};

function createSyntaxTest(syntax, tests) {
    var matchTree = buildMatchTree(syntax);
    describe(syntax, function() {
        if (tests.match) {
            tests.match.forEach(function(input) {
                it('should MATCH to "' + input + '"', function() {
                    var m = match(input, matchTree);

                    assert.equal(
                        m.result,
                        'match'
                    );

                    assert.deepEqual(
                        m.match.map(x => x.token),
                        m.tokens.map(x => x.value).filter(s => /\S/.test(s))
                    );
                });
            });
        }

        if (tests.mismatch) {
            tests.mismatch.forEach(function(input) {
                it('should NOT MATCH to "' + input + '"', function() {
                    assert.equal(
                        match(input, matchTree).result,
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
