var assert = require('assert');
var Tokenizer = require('../lib').Tokenizer;

describe('parser/tokenizer', function() {
    var css = '.test\n{\n  prop: url(foo/bar.jpg) url( a\\(\\33 \\).\\ \\"\\\'test ) calc(1 + 1) \\x \\aa ;\n}';
    var tokens = [
        { type: 'FullStop', chunk: '.', balance: 83 },
        { type: 'Identifier', chunk: 'test', balance: 83 },
        { type: 'WhiteSpace', chunk: '\n', balance: 83 },
        { type: 'LeftCurlyBracket', chunk: '{', balance: 31 },
        { type: 'WhiteSpace', chunk: '\n  ', balance: 31 },
        { type: 'Identifier', chunk: 'prop', balance: 31 },
        { type: 'Colon', chunk: ':', balance: 31 },
        { type: 'WhiteSpace', chunk: ' ', balance: 31 },
        { type: 'Url', chunk: 'url(', balance: 10 },
        { type: 'Raw', chunk: 'foo/bar.jpg', balance: 10 },
        { type: 'RightParenthesis', chunk: ')', balance: 8 },
        { type: 'WhiteSpace', chunk: ' ', balance: 31 },
        { type: 'Url', chunk: 'url(', balance: 16 },
        { type: 'WhiteSpace', chunk: ' ', balance: 16 },
        { type: 'Raw', chunk: 'a\\(\\33 \\).\\ \\"\\\'test', balance: 16 },
        { type: 'WhiteSpace', chunk: ' ', balance: 16 },
        { type: 'RightParenthesis', chunk: ')', balance: 12 },
        { type: 'WhiteSpace', chunk: ' ', balance: 31 },
        { type: 'Function', chunk: 'calc(', balance: 24 },
        { type: 'Number', chunk: '1', balance: 24 },
        { type: 'WhiteSpace', chunk: ' ', balance: 24 },
        { type: 'PlusSign', chunk: '+', balance: 24 },
        { type: 'WhiteSpace', chunk: ' ', balance: 24 },
        { type: 'Number', chunk: '1', balance: 24 },
        { type: 'RightParenthesis', chunk: ')', balance: 18 },
        { type: 'WhiteSpace', chunk: ' ', balance: 31 },
        { type: 'Identifier', chunk: '\\x', balance: 31 },
        { type: 'WhiteSpace', chunk: ' ', balance: 31 },
        { type: 'Identifier', chunk: '\\aa ', balance: 31 },
        { type: 'Semicolon', chunk: ';', balance: 31 },
        { type: 'WhiteSpace', chunk: '\n', balance: 31 },
        { type: 'RightCurlyBracket', chunk: '}', balance: 3 }
    ];
    var dump = tokens.map(function(token, idx) {
        return {
            idx: idx,
            type: token.type,
            chunk: token.chunk,
            balance: token.balance
        };
    });
    var types = tokens.map(function(token) {
        return token.type;
    });
    var start = tokens.map(function(token) {
        var start = this.offset;
        this.offset += token.chunk.length;
        return start;
    }, { offset: 0 });
    var end = tokens.map(function(token) {
        this.offset += token.chunk.length;
        return this.offset;
    }, { offset: 0 });

    it('edge case: no arguments', function() {
        var tokenizer = new Tokenizer();

        assert.equal(tokenizer.eof, true);
        assert.equal(tokenizer.tokenType, 0);
        assert.equal(tokenizer.source, '');
    });

    it('edge case: empty input', function() {
        var tokenizer = new Tokenizer('');

        assert.equal(tokenizer.eof, true);
        assert.equal(tokenizer.tokenType, 0);
        assert.equal(tokenizer.source, '');
    });

    it('should convert input to string', function() {
        var tokenizer = new Tokenizer({
            toString: function() {
                return css;
            }
        });

        assert.equal(tokenizer.source, css);
    });

    it('should accept a Buffer', function() {
        var tokenizer = new Tokenizer(new Buffer(css));

        assert.equal(tokenizer.source, css);
    });

    it('dump()', function() {
        var tokenizer = new Tokenizer(css);

        assert.deepEqual(tokenizer.dump(), dump);
    });

    it('next() types', function() {
        var tokenizer = new Tokenizer(css);
        var actual = [];

        while (!tokenizer.eof) {
            actual.push(Tokenizer.NAME[tokenizer.tokenType]);
            tokenizer.next();
        }

        assert.deepEqual(actual, types);
    });

    it('next() start', function() {
        var tokenizer = new Tokenizer(css);
        var actual = [];

        while (!tokenizer.eof) {
            actual.push(tokenizer.tokenStart);
            tokenizer.next();
        }

        assert.deepEqual(actual, start);
    });

    it('next() end', function() {
        var tokenizer = new Tokenizer(css);
        var actual = [];

        while (!tokenizer.eof) {
            actual.push(tokenizer.tokenEnd);
            tokenizer.next();
        }

        assert.deepEqual(actual, end);
    });

    it('skip()', function() {
        var tokenizer = new Tokenizer(css);
        var targetTokens = tokens
            .filter(function(token) {
                return token.type === 'Identifier' || token.type === 'FullStop';
            });
        var actual = targetTokens
            .map(function(token, idx, idents) {
                return idx ? tokens.indexOf(token) - tokens.indexOf(idents[idx - 1]) : tokens.indexOf(token);
            })
            .map(function(skip) {
                tokenizer.skip(skip);
                return Tokenizer.NAME[tokenizer.tokenType];
            });

        assert.equal(actual.length, 5); // 3 x Indentifier + 2 x FullStop
        assert.deepEqual(actual, targetTokens.map(function(token) {
            return token.type;
        }));
    });

    it('skip() to end', function() {
        var tokenizer = new Tokenizer(css);

        tokenizer.skip(tokens.length);

        assert.equal(tokenizer.eof, true);
    });

    describe('getRawLength()', function() {
        var tests = [
            {
                source: '? { }',
                start:  '^',
                skip:   '^',
                args: ['{'.charCodeAt(0), 0, false],
                expected: '? '
            },
            {
                // issues #56
                source: 'div { }',
                start:  '^',
                skip:   '^',
                args: ['{'.charCodeAt(0), 0, false],
                expected: 'div '
            },
            {
                source: 'foo(bar(1)(2)(3[{}])(4{}){}(5))',
                start:  '             ^',
                skip:   '             ^',
                args: ['{'.charCodeAt(0), 0, false],
                expected: '(3[{}])(4{})'
            },
            {
                source: 'foo(bar(1) (2) (3[{}]) (4{}) {} (5))',
                start:  '               ^',
                skip:   '                ^',
                args: ['{'.charCodeAt(0), 0, false],
                expected: '(3[{}]) (4{}) '
            },
            {
                source: 'func(a func(;))',
                start:  '     ^',
                skip:   '       ^',
                args: [';'.charCodeAt(0), 0, false],
                expected: 'a func(;)'
            },
            {
                source: 'func(a func(;))',
                start:  '     ^',
                skip:   '            ^',
                args: [';'.charCodeAt(0), 0, false],
                expected: 'a func(;)'
            },
            {
                source: 'func(a func(;); b)',
                start:  '     ^',
                skip:   '       ^',
                args: [';'.charCodeAt(0), 0, false],
                expected: 'a func(;)'
            },
            {
                source: 'func()',
                start:  '     ^',
                skip:   '     ^',
                args: [0, 0, false],
                expected: ''
            },
            {
                source: 'func([{}])',
                start:  '      ^',
                skip:   '       ^',
                args: [0, 0, false],
                expected: '{}'
            },
            {
                source: 'func([{})',
                start:  '     ^',
                skip:   '      ^',
                args: [0, 0, false],
                expected: '[{})'
            },
            {
                source: 'func(1, 2, 3) {}',
                start:  '^',
                skip:   '      ^',
                args: [0, 0, false],
                expected: 'func(1, 2, 3) {}'
            }
        ];

        tests.forEach(function(test, idx) {
            it('testcase#' + idx, function() {
                var tokenizer = new Tokenizer(test.source);
                var startOffset = test.start.indexOf('^');
                var skipToOffset = test.skip.indexOf('^');
                var startToken = tokenizer.currentToken;

                while (tokenizer.tokenStart < startOffset) {
                    tokenizer.next();
                    startToken = tokenizer.currentToken;
                }

                while (tokenizer.tokenStart < skipToOffset) {
                    tokenizer.next();
                }

                tokenizer.skip(tokenizer.getRawLength.apply(tokenizer, [startToken].concat(test.args)));
                assert.equal(
                    tokenizer.source.substring(startOffset, tokenizer.tokenStart),
                    test.expected
                );
            });
        });
    });

    it('dynamic buffer', function() {
        var bufferSize = new Tokenizer(css).offsetAndType.length + 10;
        var tokenizer = new Tokenizer(new Array(bufferSize + 1).join('.'));
        var count = 0;

        while (!tokenizer.eof) {
            count++;
            tokenizer.next();
        }

        assert.equal(count, bufferSize);
        assert(tokenizer.offsetAndType.length >= bufferSize);
    });
});
