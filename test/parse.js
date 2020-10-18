var assert = require('assert');
var syntax = require('../lib');
var parse = require('../lib').parse;
var TYPE = require('../lib').tokenize.TYPE;
var toPlainObject = require('../lib').toPlainObject;
var walk = require('../lib').walk;
var lexer = require('../lib').lexer;
var List = require('../lib').List;
var forEachParseTest = require('./fixture/parse').forEachTest;
var genericTypesFixture = require('./fixture/syntax-match/generic.json');
var stringify = require('./helpers/stringify');
var merge = require('./helpers').merge;

var DollarSign = 0x0024; // U+0024 DOLLAR SIGN ($)
var Ampersand = 0x0026;  // U+0026 ANPERSAND (&)

function repeat(str, count) {
    return new Array(count + 1).join(str);
}

function checkStructure(ast) {
    var warnings = lexer.checkStructure(ast);

    if (Array.isArray(warnings)) {
        warnings = warnings.map(function(entry) {
            return entry.message;
        });
    }

    return warnings;
}

function createParseErrorTest(name, test, options) {
    (test.skip ? it.skip : it)(name + ' ' + JSON.stringify(test.source), function() {
        var error;

        assert.throws(function() {
            parse(test.source, options);
        }, function(e) {
            error = e;
            if (e.parseError) {
                return true;
            }
        }, 'Should be a CSS parse error');

        assert.equal(error.message, test.error);
        assert.deepEqual(error.parseError, test.position);
    });
}

describe('parse', function() {
    describe('basic', function() {
        forEachParseTest(function createParseTest(name, test) {
            (test.skip ? it.skip : it)(name, function() {
                var ast = parse(test.source, test.options);

                // AST should be equal
                assert.equal(stringify(ast), stringify(test.ast));

                // structure should be correct
                assert.equal(checkStructure(ast), false);
            });
        });

        describe('AnPlusB', function() {
            var fixture = genericTypesFixture['<an-plus-b>'];

            fixture.valid.forEach(function(value) {
                it(value, function() {
                    var actual = parse(':nth-child(' + value + ')', { context: 'selector' }).children.first().children.first().nth;
                    var a = value.match(/^([+-]?)(\d+)?n/i);
                    var b = value.match(/([+-]?)\s*(\d+)$/);
                    var expected = {
                        type: 'AnPlusB',
                        a: a ? (a[1] === '-' ? '-' : '') + (a[2] || '1') : null,
                        b: b ? (b[1] === '-' ? '-' : '') + b[2] : null
                    };

                    // AST should be equal
                    assert.equal(stringify(actual), stringify(expected));

                    // structure should be correct
                    assert.equal(checkStructure(actual), false);
                });
            });

            fixture.invalid.forEach(function(value) {
                it(value, function() {
                    assert.throws(function() {
                        parse(':nth-child(' + value + ')', { context: 'selector' });
                    });
                });
            });
        });

        describe('UnicodeRange', function() {
            var fixture = genericTypesFixture['<urange>'];

            fixture.valid.forEach(function(value) {
                it(value, function() {
                    var actual = parse(value, { context: 'value' }).children.first();
                    var expected = {
                        type: 'UnicodeRange',
                        value: value
                    };

                    // AST should be equal
                    assert.equal(stringify(actual), stringify(expected));

                    // structure should be correct
                    assert.equal(checkStructure(actual), false);
                });
            });

            fixture.invalid.forEach(function(value) {
                it(value, function() {
                    assert.throws(function() {
                        var actual = parse(value, { context: 'value' });
                        var expected = {
                            type: 'Value',
                            children: [{
                                type: 'Raw',
                                value: value
                            }]
                        };

                        // AST should not be equal
                        assert.equal(stringify(actual), stringify(expected));
                    });
                });
            });
        });
    });

    describe('context', function() {
        it('should take parse context', function() {
            assert.deepEqual(parse('property: value'), {
                type: 'StyleSheet',
                loc: null,
                children: new List().appendData({
                    type: 'Raw',
                    loc: null,
                    value: 'property: value'
                })
            });

            assert.deepEqual(parse('property: value', {
                context: 'declaration'
            }), {
                type: 'Declaration',
                loc: null,
                important: false,
                property: 'property',
                value: {
                    type: 'Value',
                    loc: null,
                    children: new List().appendData({
                        type: 'Identifier',
                        loc: null,
                        name: 'value'
                    })
                }
            });
        });

        it('wrong context', function() {
            assert.throws(function() {
                parse('a{}', { context: 'unknown' });
            }, /Unknown context `unknown`/);
        });
    });

    it('should call onParseError when handler is passed', function() {
        var errors = [];
        var ast = parse('{ a: 1!; foo; b: 2 }', {
            context: 'block',
            onParseError: function(error, fallbackNode) {
                errors.push({
                    error: error,
                    fallback: fallbackNode
                });
            }
        });

        assert.equal(ast.children.getSize(), 3);
        assert.equal(errors.length, 2);
        assert.equal(errors[0].error.message, 'Identifier is expected');
        assert.equal(errors[0].fallback.value, 'a: 1!;');
        assert.equal(errors[1].error.message, 'Colon is expected');
        assert.equal(errors[1].fallback.value, 'foo;');
    });

    describe('errors', function() {
        var throwOnParseErrorOptions = {
            onParseError: function(e) {
                throw e;
            }
        };

        forEachParseTest(function(name, test) {
            createParseErrorTest(name, test, merge(test.options, {
                positions: false
            }));
            createParseErrorTest(name + ' (with positions)', test, merge(test.options, {
                positions: true
            }));
        }, true);

        it('formattedMessage', function() {
            assert.throws(function() {
                parse('/**/\n.\nfoo', throwOnParseErrorOptions);
            }, function(e) {
                assert.equal(e.formattedMessage,
                    'Parse error: Identifier is expected\n' +
                    '    1 |/**/\n' +
                    '    2 |.\n' +
                    '--------^\n' +
                    '    3 |foo'
                );
                assert.equal(e.sourceFragment(),
                    '    2 |.\n' +
                    '--------^'
                );
                assert.equal(e.sourceFragment(3),
                    '    1 |/**/\n' +
                    '    2 |.\n' +
                    '--------^\n' +
                    '    3 |foo'
                );

                return true;
            });
        });

        it('formattedMessage at eof', function() {
            assert.throws(function() {
                parse('.', throwOnParseErrorOptions);
            }, function(e) {
                assert.equal(e.formattedMessage,
                    'Parse error: Identifier is expected\n' +
                    '    1 |.\n' +
                    '--------^'
                );

                return true;
            });
        });

        it('formattedMessage (windows new lines)', function() {
            assert.throws(function() {
                parse('/**/\r\n.\r\nfoo', throwOnParseErrorOptions);
            }, function(e) {
                assert.equal(e.formattedMessage,
                    'Parse error: Identifier is expected\n' +
                    '    1 |/**/\n' +
                    '    2 |.\n' +
                    '--------^\n' +
                    '    3 |foo'
                );
                assert.equal(e.sourceFragment(),
                    '    2 |.\n' +
                    '--------^'
                );
                assert.equal(e.sourceFragment(3),
                    '    1 |/**/\n' +
                    '    2 |.\n' +
                    '--------^\n' +
                    '    3 |foo'
                );

                return true;
            });
        });

        it('formattedMessage with tabs', function() {
            assert.throws(function() {
                parse('a {\n\tb:\tc#\t\n}', throwOnParseErrorOptions);
            }, function(e) {
                assert.equal(e.formattedMessage,
                    'Parse error: Hex or identifier is expected\n' +
                    '    1 |a {\n' +
                    '    2 |    b:    c#    \n' +
                    '-------------------^\n' +
                    '    3 |}'
                );

                return true;
            });
        });

        it('formattedMessage for source with long lines', function() {
            assert.throws(function() {
                parse(
                    '/*' + repeat('1234567890', 20) + '*/\n' +
                    repeat(' ', 117) + '.\n' +
                    'foo\n' +
                    repeat(' ', 120) + 'bar',
                    throwOnParseErrorOptions
                );
            }, function(e) {
                assert.equal(e.formattedMessage,
                    'Parse error: Identifier is expected\n' +
                    '    1 |…12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678…\n' +
                    '    2 |…                                                       .\n' +
                    '----------------------------------------------------------------^\n' +
                    '    3 |\n' +
                    '    4 |…                                                          bar'
                );

                return true;
            });
        });
    });

    describe('onComment', () => {
        const source = '/*123*/.foo[a=/* 234 */] {\n  color: red; /* 345*/\n  background: url(/*456*/foo);\n} /*567*';

        it('with no locations', () => {
            const actual = [];
            parse(source, {
                onComment(value, loc) {
                    actual.push({ value, loc });
                }
            });

            assert.deepEqual(actual, [
                { value: '123', loc: null },
                { value: ' 234 ', loc: null },
                { value: ' 345', loc: null },
                { value: '567*', loc: null }
            ]);
        });

        it('with locations', () => {
            const actual = [];
            const offsetToPos = offset => {
                const lines = source.slice(0, offset).split('\n');
                return {
                    offset,
                    line: lines.length,
                    column: lines.pop().length + 1
                };
            };
            const loc = (start, end) => {
                return {
                    source: 'test.css',
                    start: offsetToPos(start),
                    end: offsetToPos(end)
                };
            };

            parse(source, {
                filename: 'test.css',
                positions: true,
                onComment(value, loc) {
                    actual.push({ value, loc });
                }
            });

            assert.deepEqual(actual, [
                { value: '123', loc: loc(0, 7) },
                { value: ' 234 ', loc: loc(14, 23) },
                { value: ' 345', loc: loc(41, 49) },
                { value: '567*', loc: loc(83, 89) }
            ]);
        });
    });

    describe('positions', function() {
        it('should start with line 1 column 1 by default', function() {
            var ast = parse('.foo.bar {\n  property: value 123 123.4 .123 123px 99% #fff url( a ) / var( --a ), "test" \'test\';\n}', {
                positions: true
            });
            var positions = [];

            walk(ast, function(node) {
                if (node.loc) {
                    positions.push([
                        node.loc.start.offset,
                        node.loc.start.line,
                        node.loc.start.column,
                        node.type
                    ]);
                }
            });

            assert.equal(checkStructure(ast), false);
            assert.deepEqual(positions, [
                [0, 1, 1, 'StyleSheet'],
                [0, 1, 1, 'Rule'],
                [0, 1, 1, 'SelectorList'],
                [0, 1, 1, 'Selector'],
                [0, 1, 1, 'ClassSelector'],
                [4, 1, 5, 'ClassSelector'],
                [9, 1, 10, 'Block'],
                [13, 2, 3, 'Declaration'],
                [23, 2, 13, 'Value'],
                [23, 2, 13, 'Identifier'],
                [29, 2, 19, 'Number'],
                [33, 2, 23, 'Number'],
                [39, 2, 29, 'Number'],
                [44, 2, 34, 'Dimension'],
                [50, 2, 40, 'Percentage'],
                [54, 2, 44, 'Hash'],
                [59, 2, 49, 'Url'],
                [64, 2, 54, 'Raw'],
                [68, 2, 58, 'Operator'],
                [70, 2, 60, 'Function'],
                [75, 2, 65, 'Identifier'],
                [80, 2, 70, 'Operator'],
                [82, 2, 72, 'String'],
                [89, 2, 79, 'String']
            ]);
        });

        it('should start with specified offset, line and column', function() {
            var ast = parse('.foo.bar {\n  property: value 123 123.4 .123 123px 99% #fff url( a ) / var( --a ), "test" \'test\';\n}', {
                positions: true,
                offset: 100,
                line: 3,
                column: 5
            });
            var positions = [];

            walk(ast, function(node) {
                if (node.loc) {
                    positions.push([
                        node.loc.start.offset,
                        node.loc.start.line,
                        node.loc.start.column,
                        node.type
                    ]);
                }
            });

            assert.equal(checkStructure(ast), false);
            assert.deepEqual(positions, [
                [100, 3, 5, 'StyleSheet'],
                [100, 3, 5, 'Rule'],
                [100, 3, 5, 'SelectorList'],
                [100, 3, 5, 'Selector'],
                [100, 3, 5, 'ClassSelector'],
                [104, 3, 9, 'ClassSelector'],
                [109, 3, 14, 'Block'],
                [113, 4, 3, 'Declaration'],
                [123, 4, 13, 'Value'],
                [123, 4, 13, 'Identifier'],
                [129, 4, 19, 'Number'],
                [133, 4, 23, 'Number'],
                [139, 4, 29, 'Number'],
                [144, 4, 34, 'Dimension'],
                [150, 4, 40, 'Percentage'],
                [154, 4, 44, 'Hash'],
                [159, 4, 49, 'Url'],
                [164, 4, 54, 'Raw'],
                [168, 4, 58, 'Operator'],
                [170, 4, 60, 'Function'],
                [175, 4, 65, 'Identifier'],
                [180, 4, 70, 'Operator'],
                [182, 4, 72, 'String'],
                [189, 4, 79, 'String']
            ]);
        });
    });

    describe('extension', function() {
        describe('value', function() {
            var extended = syntax.fork(function(syntaxConfig) {
                var defaultGetNode = syntaxConfig.scope.Value.getNode;

                syntaxConfig.scope.Value.getNode = function(context) {
                    if (this.scanner.isDelim(DollarSign)) {
                        var start = this.scanner.tokenStart;
                        this.scanner.next();

                        return {
                            type: 'Variable',
                            loc: this.getLocation(start, this.scanner.tokenEnd),
                            name: this.consume(TYPE.Ident)
                        };
                    }

                    return defaultGetNode.call(this, context);
                };

                return syntaxConfig;
            });

            it('should not affect base syntax', function() {
                assert.throws(function() {
                    parse('$a', {
                        context: 'value'
                    });
                }, /Unexpected input/);
            });

            it('should parse according new rules', function() {
                var ast = extended.parse('$a', {
                    context: 'value'
                });

                assert.deepEqual(toPlainObject(ast), {
                    type: 'Value',
                    loc: null,
                    children: [
                        {
                            type: 'Variable',
                            loc: null,
                            name: 'a'
                        }
                    ]
                });
            });

            it('should fail on unknown', function() {
                assert.throws(function() {
                    extended.parse('@a', {
                        context: 'value'
                    });
                }, /Unexpected input/);
            });
        });

        describe('selector', function() {
            var extended = syntax.fork(function(syntaxConfig) {
                var defaultGetNode = syntaxConfig.scope.Selector.getNode;

                syntaxConfig.scope.Selector.getNode = function(context) {
                    if (this.scanner.isDelim(Ampersand)) {
                        var start = this.scanner.tokenStart;
                        this.scanner.next();

                        return {
                            type: 'Nested',
                            loc: this.getLocation(start, this.scanner.tokenEnd)
                        };
                    }

                    return defaultGetNode.call(this, context);
                };

                return syntaxConfig;
            });

            it('should not affect base syntax', function() {
                assert.throws(function() {
                    parse('a &', {
                        context: 'selector'
                    });
                }, /Unexpected input/);
            });

            it('should parse according new rules', function() {
                var ast = extended.parse('a &', {
                    context: 'selector'
                });

                assert.deepEqual(toPlainObject(ast), {
                    type: 'Selector',
                    loc: null,
                    children: [
                        {
                            type: 'TypeSelector',
                            loc: null,
                            name: 'a'
                        },
                        {
                            type: 'WhiteSpace',
                            loc: null,
                            value: ' '
                        },
                        {
                            type: 'Nested',
                            loc: null
                        }
                    ]
                });
            });

            it('should fail on unknown', function() {
                assert.throws(function() {
                    extended.parse('@a', {
                        context: 'selector'
                    });
                }, /Selector is expected/);
            });
        });
    });
});
