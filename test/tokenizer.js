var assert = require('assert');
var Tokenizer = require('../lib').Tokenizer;

describe('parser/tokenizer', function() {
    var css = '.test\n{\n  prop: url(foo/bar.jpg) calc(1 + 1);\n}';
    var tokens = [
        { type: 'FullStop', chunk: '.' },
        { type: 'Identifier', chunk: 'test' },
        { type: 'WhiteSpace', chunk: '\n' },
        { type: 'LeftCurlyBracket', chunk: '{' },
        { type: 'WhiteSpace', chunk: '\n  ' },
        { type: 'Identifier', chunk: 'prop' },
        { type: 'Colon', chunk: ':' },
        { type: 'WhiteSpace', chunk: ' ' },
        { type: 'Url', chunk: 'url(' },
        { type: 'Identifier', chunk: 'foo' },
        { type: 'Solidus', chunk: '/' },
        { type: 'Identifier', chunk: 'bar' },
        { type: 'FullStop', chunk: '.' },
        { type: 'Identifier', chunk: 'jpg' },
        { type: 'RightParenthesis', chunk: ')' },
        { type: 'WhiteSpace', chunk: ' ' },
        { type: 'Function', chunk: 'calc(' },
        { type: 'Number', chunk: '1' },
        { type: 'WhiteSpace', chunk: ' ' },
        { type: 'PlusSign', chunk: '+' },
        { type: 'WhiteSpace', chunk: ' ' },
        { type: 'Number', chunk: '1' },
        { type: 'RightParenthesis', chunk: ')' },
        { type: 'Semicolon', chunk: ';' },
        { type: 'WhiteSpace', chunk: '\n' },
        { type: 'RightCurlyBracket', chunk: '}' }
    ];
    var dump = tokens.map(function(token) {
        return { type: token.type, chunk: token.chunk };
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

        assert.equal(actual.length, 7); // 5 x Indentifier + 2 x FullStop
        assert.deepEqual(actual, targetTokens.map(function(token) {
            return token.type;
        }));
    });

    it('skip() to end', function() {
        var tokenizer = new Tokenizer(css);

        tokenizer.skip(tokens.length);

        assert.equal(tokenizer.eof, true);
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
