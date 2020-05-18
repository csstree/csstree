const assert = require('assert');
const { TokenStream, tokenize } = require('./helpers/lib');
const fixture = require('./fixture/tokenize');

describe('tokenize/stream', () => {
    const createStream = source => new TokenStream(source, tokenize);
    const css = '.test\n{\n  prop: url(foo/bar.jpg) url( a\\(\\33 \\).\\ \\"\\\'test ) calc(1 + 1) \\x \\aa ;\n}<!--<-->\\\n';
    const tokens = [
        { type: 'Delim', chunk: '.', balance: 93 },
        { type: 'Ident', chunk: 'test', balance: 93 },
        { type: 'WhiteSpace', chunk: '\n', balance: 93 },
        { type: 'LeftCurlyBracket', chunk: '{', balance: 25 },
        { type: 'WhiteSpace', chunk: '\n  ', balance: 25 },
        { type: 'Ident', chunk: 'prop', balance: 25 },
        { type: 'Colon', chunk: ':', balance: 25 },
        { type: 'WhiteSpace', chunk: ' ', balance: 25 },
        { type: 'Url', chunk: 'url(foo/bar.jpg)', balance: 25 },
        { type: 'WhiteSpace', chunk: ' ', balance: 25 },
        { type: 'Url', chunk: 'url( a\\(\\33 \\).\\ \\"\\\'test )', balance: 25 },
        { type: 'WhiteSpace', chunk: ' ', balance: 25 },
        { type: 'Function', chunk: 'calc(', balance: 18 },
        { type: 'Number', chunk: '1', balance: 18 },
        { type: 'WhiteSpace', chunk: ' ', balance: 18 },
        { type: 'Delim', chunk: '+', balance: 18 },
        { type: 'WhiteSpace', chunk: ' ', balance: 18 },
        { type: 'Number', chunk: '1', balance: 18 },
        { type: 'RightParenthesis', chunk: ')', balance: 12 },
        { type: 'WhiteSpace', chunk: ' ', balance: 25 },
        { type: 'Ident', chunk: '\\x', balance: 25 },
        { type: 'WhiteSpace', chunk: ' ', balance: 25 },
        { type: 'Ident', chunk: '\\aa ', balance: 25 },
        { type: 'Semicolon', chunk: ';', balance: 25 },
        { type: 'WhiteSpace', chunk: '\n', balance: 25 },
        { type: 'RightCurlyBracket', chunk: '}', balance: 3 },
        { type: 'CDO', chunk: '<!--', balance: 93 },
        { type: 'Delim', chunk: '<', balance: 93 },
        { type: 'CDC', chunk: '-->', balance: 93 },
        { type: 'Delim', chunk: '\\', balance: 93 },
        { type: 'WhiteSpace', chunk: '\n', balance: 93 }
    ];
    const dump = tokens.map(({ type, chunk, balance }, idx) => ({
        idx,
        type,
        chunk,
        balance
    }));
    const types = tokens.map(token => token.type);
    const start = tokens.map(function(token) {
        const start = this.offset;
        this.offset += token.chunk.length;
        return start;
    }, { offset: 0 });
    const end = tokens.map(function(token) {
        this.offset += token.chunk.length;
        return this.offset;
    }, { offset: 0 });

    it('edge case: no arguments', () => {
        const stream = createStream();

        assert.equal(stream.eof, true);
        assert.equal(stream.tokenType, 0);
        assert.equal(stream.source, '');
    });

    it('edge case: empty input', () => {
        const stream = createStream('');

        assert.equal(stream.eof, true);
        assert.equal(stream.tokenType, 0);
        assert.equal(stream.source, '');
    });

    it('should convert input to string', () => {
        const stream = createStream({
            toString() {
                return css;
            }
        });

        assert.equal(stream.source, css);
    });

    it('should accept a Buffer', () => {
        const stream = createStream(Buffer.from(css));

        assert.equal(stream.source, css);
    });

    it('dump()', () => {
        const stream = createStream(css);

        assert.deepEqual(stream.dump(), dump);
    });

    it('next() types', () => {
        const stream = createStream(css);
        const actual = [];

        while (!stream.eof) {
            actual.push(tokenize.NAME[stream.tokenType]);
            stream.next();
        }

        assert.deepEqual(actual, types);
    });

    it('next() start', () => {
        const stream = createStream(css);
        const actual = [];

        while (!stream.eof) {
            actual.push(stream.tokenStart);
            stream.next();
        }

        assert.deepEqual(actual, start);
    });

    it('next() end', () => {
        const stream = createStream(css);
        const actual = [];

        while (!stream.eof) {
            actual.push(stream.tokenEnd);
            stream.next();
        }

        assert.deepEqual(actual, end);
    });

    it('skip()', () => {
        const stream = createStream(css);
        const targetTokens = tokens.filter(token =>
            token.type === 'Ident' || token.type === 'Delim'
        );
        const actual = targetTokens
            .map(function(token, idx, idents) {
                return idx ? tokens.indexOf(token) - tokens.indexOf(idents[idx - 1]) : tokens.indexOf(token);
            })
            .map(function(skip) {
                stream.skip(skip);
                return tokenize.NAME[stream.tokenType];
            });

        assert.equal(actual.length, 8); // 4 x Indentifier + 4 x Delim
        assert.deepEqual(actual, targetTokens.map(token => token.type));
    });

    it('skip() to end', () => {
        const stream = createStream(css);

        stream.skip(tokens.length);

        assert.equal(stream.eof, true);
    });

    describe('Raw', () => {
        const LEFTCURLYBRACKET = 0x007B; // U+007B LEFT CURLY BRACKET ({)
        const SEMICOLON = 0x003B;        // U+003B SEMICOLON (;)
        const leftCurlyBracket = code => code === LEFTCURLYBRACKET ? 1 : 0;
        const semicolonIncluded = code => code === SEMICOLON ? 2 : 0;
        /* eslint-disable key-spacing */
        const tests = [
            {
                source: '? { }',
                start:  '^',
                skip:   '^',
                mode: leftCurlyBracket,
                expected: '? '
            },
            {
                // issues #56
                source: 'div { }',
                start:  '^',
                skip:   '^',
                mode: leftCurlyBracket,
                expected: 'div '
            },
            {
                source: 'foo(bar(1)(2)(3[{}])(4{}){}(5))',
                start:  '             ^',
                skip:   '             ^',
                mode: leftCurlyBracket,
                expected: '(3[{}])(4{})'
            },
            {
                source: 'foo(bar(1) (2) (3[{}]) (4{}) {} (5))',
                start:  '               ^',
                skip:   '                ^',
                mode: leftCurlyBracket,
                expected: '(3[{}]) (4{}) '
            },
            {
                source: 'func(a func(;))',
                start:  '     ^',
                skip:   '       ^',
                mode: semicolonIncluded,
                expected: 'a func(;)'
            },
            {
                source: 'func(a func(;))',
                start:  '     ^',
                skip:   '            ^',
                mode: semicolonIncluded,
                expected: 'a func(;)'
            },
            {
                source: 'func(a func(;); b)',
                start:  '     ^',
                skip:   '       ^',
                mode: semicolonIncluded,
                expected: 'a func(;);'
            },
            {
                source: 'func()',
                start:  '     ^',
                skip:   '     ^',
                mode: null,
                expected: ''
            },
            {
                source: 'func([{}])',
                start:  '      ^',
                skip:   '       ^',
                mode: null,
                expected: '{}'
            },
            {
                source: 'func([{})',
                start:  '     ^',
                skip:   '      ^',
                mode: null,
                expected: '[{})'
            },
            {
                source: 'func(1, 2, 3) {}',
                start:  '^',
                skip:   '      ^',
                mode: null,
                expected: 'func(1, 2, 3) {}'
            }
        ];
        /* eslint-enable key-spacing */

        tests.forEach(function(test, idx) {
            it('testcase#' + idx, () => {
                const stream = createStream(test.source, tokenize);
                const startOffset = test.start.indexOf('^');
                const skipToOffset = test.skip.indexOf('^');
                let startToken = stream.tokenIndex;

                while (stream.tokenStart < startOffset) {
                    stream.next();
                    startToken = stream.tokenIndex;
                }

                while (stream.tokenStart < skipToOffset) {
                    stream.next();
                }

                stream.skipUntilBalanced(startToken, test.mode || (() => 0));
                assert.equal(
                    stream.source.substring(startOffset, stream.tokenStart),
                    test.expected
                );
            });
        });
    });

    it('dynamic buffer', () => {
        const bufferSize = createStream(css, tokenize).offsetAndType.length + 10;
        const stream = createStream('.'.repeat(bufferSize), tokenize);
        let count = 0;

        while (!stream.eof) {
            count++;
            stream.next();
        }

        assert.equal(count, bufferSize);
        assert(stream.offsetAndType.length >= bufferSize);
    });

    describe('values', () => {
        ['valid', 'invalid'].forEach(testType => {
            fixture.forEachTest(testType, (name, value, expected) => {
                it(name, () => {
                    const actual = [];

                    tokenize(value, (type, start, end) => actual.push({
                        type: tokenize.NAME[type],
                        chunk: value.substring(start, end)
                    }));

                    assert[testType === 'valid' ? 'deepEqual' : 'notDeepEqual'](
                        actual,
                        expected
                    );
                });
            });
        });
    });
});
