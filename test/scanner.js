var assert = require('assert');
var Scanner = require('../lib/scanner');

describe('parser/scanner', function() {
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
        var scanner = new Scanner();

        assert.equal(scanner.eof, true);
        assert.equal(scanner.tokenType, 0);
    });

    it('edge case: empty input', function() {
        var scanner = new Scanner('');

        assert.equal(scanner.eof, true);
        assert.equal(scanner.tokenType, 0);
    });

    it('getTypes()', function() {
        var scanner = new Scanner(css);

        assert.deepEqual(scanner.getTypes(), types);
    });

    it('next() types', function() {
        var scanner = new Scanner(css);
        var actual = [];

        while (!scanner.eof) {
            actual.push(Scanner.NAME[scanner.tokenType]);
            scanner.next();
        }

        assert.deepEqual(actual, types);
    });

    it('next() start', function() {
        var scanner = new Scanner(css);
        var actual = [];

        while (!scanner.eof) {
            actual.push(scanner.tokenStart);
            scanner.next();
        }

        assert.deepEqual(actual, start);
    });

    it('next() end', function() {
        var scanner = new Scanner(css);
        var actual = [];

        while (!scanner.eof) {
            actual.push(scanner.tokenEnd);
            scanner.next();
        }

        assert.deepEqual(actual, end);
    });

    it('skip()', function() {
        var scanner = new Scanner(css);
        var targetTokens = tokens
            .filter(function(token) {
                return token.type === 'Identifier' || token.type === 'FullStop';
            });
        var actual = targetTokens
            .map(function(token, idx, idents) {
                return idx ? tokens.indexOf(token) - tokens.indexOf(idents[idx - 1]) : tokens.indexOf(token);
            })
            .map(function(skip) {
                scanner.skip(skip);
                return Scanner.NAME[scanner.tokenType];
            });

        assert.equal(actual.length, 8); // 6 x Indentifier + 2 x FullStop
        assert.deepEqual(actual, targetTokens.map(function(token) {
            return token.type;
        }));
    });

    it('skip() to end', function() {
        var scanner = new Scanner(css);

        scanner.skip(tokens.length);

        assert.equal(scanner.eof, true);
    });

    it('dynamic buffer', function() {
        var bufferSize = new Scanner(css).offsetAndType.length + 10;
        var scanner = new Scanner(new Array(bufferSize + 1).join('.'));
        var count = 0;

        while (!scanner.eof) {
            count++;
            scanner.next();
        }

        assert.equal(count, bufferSize);
        assert(scanner.offsetAndType.length >= bufferSize);
    });
});
