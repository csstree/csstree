var assert = require('assert');
var Tokenizer = require('../lib').Tokenizer;

describe('parser/tokenizer', function() {
    var css = '.test\n{\n  prop: url(foo/bar.jpg);\n}';
    var tokens = [
        { offset: 0, type: 'FullStop', chunk: '.' },
        { offset: 1, type: 'Identifier', chunk: 'test' },
        { offset: 5, type: 'WhiteSpace', chunk: '\n' },
        { offset: 6, type: 'LeftCurlyBracket', chunk: '{' },
        { offset: 7, type: 'WhiteSpace', chunk: '\n  ' },
        { offset: 10, type: 'Identifier', chunk: 'prop' },
        { offset: 14, type: 'Colon', chunk: ':' },
        { offset: 15, type: 'WhiteSpace', chunk: ' ' },
        { offset: 16, type: 'Url', chunk: 'url(' },
        { offset: 20, type: 'Identifier', chunk: 'foo' },
        { offset: 23, type: 'Solidus', chunk: '/' },
        { offset: 24, type: 'Identifier', chunk: 'bar' },
        { offset: 27, type: 'FullStop', chunk: '.' },
        { offset: 28, type: 'Identifier', chunk: 'jpg' },
        { offset: 31, type: 'RightParenthesis', chunk: ')' },
        { offset: 32, type: 'Semicolon', chunk: ';' },
        { offset: 33, type: 'WhiteSpace', chunk: '\n' },
        { offset: 34, type: 'RightCurlyBracket', chunk: '}' }
    ];
    var dump = tokens.map(function(token) {
        return { type: token.type, chunk: token.chunk };
    });
    var types = tokens.map(function(token) {
        return token.type;
    });
    var start = tokens.map(function(token) {
        return token.offset;
    });
    var end = tokens.map(function(token, idx, tokens) {
        return idx + 1 < tokens.length ? tokens[idx + 1].offset : css.length;
    });

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
