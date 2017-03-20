var assert = require('assert');
var Tokenizer = require('../lib').Tokenizer;

describe('parser/tokenizer', function() {
    var css = '.test\n{\n  prop: url(foo/bar.jpg);\n}';
    var tokens = [
        { offset: 0, type: 'FullStop' },
        { offset: 1, type: 'Identifier' },
        { offset: 5, type: 'Whitespace' },
        { offset: 6, type: 'LeftCurlyBracket' },
        { offset: 7, type: 'Whitespace' },
        { offset: 10, type: 'Identifier' },
        { offset: 14, type: 'Colon' },
        { offset: 15, type: 'Whitespace' },
        { offset: 16, type: 'Identifier' },
        { offset: 19, type: 'LeftParenthesis' },
        { offset: 20, type: 'Identifier' },
        { offset: 23, type: 'Solidus' },
        { offset: 24, type: 'Identifier' },
        { offset: 27, type: 'FullStop' },
        { offset: 28, type: 'Identifier' },
        { offset: 31, type: 'RightParenthesis' },
        { offset: 32, type: 'Semicolon' },
        { offset: 33, type: 'Whitespace' },
        { offset: 34, type: 'RightCurlyBracket' }
    ];
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

    it('getTypes()', function() {
        var tokenizer = new Tokenizer(css);

        assert.deepEqual(tokenizer.getTypes(), types);
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

        assert.equal(actual.length, 8); // 6 x Indentifier + 2 x FullStop
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
