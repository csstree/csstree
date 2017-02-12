var assert = require('assert');
var parse = require('../lib/parser');
var Parser = require('../lib').Parser;
var TYPE = require('../lib').Tokenizer.TYPE;
var toPlainObject = require('../lib/utils/convert').toPlainObject;
var walk = require('../lib/utils/walk').all;
var translate = require('../lib/utils/translate');
var forEachParseTest = require('./fixture/parse').forEachTest;
var stringify = require('./helpers/stringify');
var merge = require('./helpers').merge;

function repeat(str, count) {
    return new Array(count + 1).join(str);
}

function createParseErrorTest(name, test, options) {
    it(name + ' ' + JSON.stringify(test.source), function() {
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
            it(name, function() {
                var ast = parse(test.source, test.options);

                // AST should be equal
                assert.equal(stringify(ast), stringify(test.ast));

                // translated AST should be equal to original source
                assert.equal(translate(ast), 'translate' in test ? test.translate : test.source);
            });
        });
    });

    describe('context', function() {
        it('wrong context', function() {
            assert.throws(function() {
                parse('a{}', { context: 'unknown' });
            }, 'Unknown context `unknown`');
        });
    });

    describe('errors', function() {
        forEachParseTest(function(name, test) {
            createParseErrorTest(name, test, merge(test.options, {
                positions: false
            }));
            createParseErrorTest(name + ' (with positions)', test, merge(test.options, {
                positions: true
            }));
        }, true);

        it('formattedMessage', function() {
            try {
                parse('/**/\n.\nfoo');
            } catch (e) {
                assert.equal(e.formattedMessage,
                    'Parse error: Identifier is expected\n' +
                    '    1 |/**/\n' +
                    '    2 |.\n' +
                    '--------^\n' +
                    '    3 |foo'
                );
                assert.equal(e.sourceFragment(),
                    '    2 |.\n' +
                    '--------^\n'
                );
                assert.equal(e.sourceFragment(3),
                    '    1 |/**/\n' +
                    '    2 |.\n' +
                    '--------^\n' +
                    '    3 |foo'
                );
            }
        });

        it('formattedMessage for source with long lines', function() {
            try {
                parse(
                    '/*' + repeat('1234567890', 20) + '*/\n' +
                    repeat(' ', 117) + '.\n' +
                    'foo\n' +
                    repeat(' ', 120) + 'bar'
                );
            } catch (e) {
                assert.equal(e.formattedMessage,
                    'Parse error: Identifier is expected\n' +
                    '    1 |…12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678…\n' +
                    '    2 |…                                                       .\n' +
                    '----------------------------------------------------------------^\n' +
                    '    3 |\n' +
                    '    4 |…                                                          bar'
                );
            }
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

            assert.deepEqual(positions, [
                [0, 1, 1, 'StyleSheet'],
                [0, 1, 1, 'Rule'],
                [0, 1, 1, 'SelectorList'],
                [0, 1, 1, 'Selector'],
                [0, 1, 1, 'ClassSelector'],
                [4, 1, 5, 'ClassSelector'],
                [9, 1, 10, 'Block'],
                [13, 2, 3, 'Declaration'],
                [22, 2, 12, 'Value'],
                [23, 2, 13, 'Identifier'],
                [29, 2, 19, 'Number'],
                [33, 2, 23, 'Number'],
                [39, 2, 29, 'Number'],
                [44, 2, 34, 'Dimension'],
                [50, 2, 40, 'Percentage'],
                [54, 2, 44, 'HexColor'],
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

            assert.deepEqual(positions, [
                [100, 3, 5, 'StyleSheet'],
                [100, 3, 5, 'Rule'],
                [100, 3, 5, 'SelectorList'],
                [100, 3, 5, 'Selector'],
                [100, 3, 5, 'ClassSelector'],
                [104, 3, 9, 'ClassSelector'],
                [109, 3, 14, 'Block'],
                [113, 4, 3, 'Declaration'],
                [122, 4, 12, 'Value'],
                [123, 4, 13, 'Identifier'],
                [129, 4, 19, 'Number'],
                [133, 4, 23, 'Number'],
                [139, 4, 29, 'Number'],
                [144, 4, 34, 'Dimension'],
                [150, 4, 40, 'Percentage'],
                [154, 4, 44, 'HexColor'],
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
            var extended = new Parser();
            extended.readSequenceFallback = function() {
                if (this.scanner.tokenType === TYPE.DollarSign) {
                    var start = this.scanner.tokenStart;
                    this.scanner.next();

                    return {
                        type: 'Variable',
                        loc: this.getLocation(start, this.scanner.tokenEnd),
                        name: this.scanner.consume(TYPE.Identifier)
                    };
                }
            };

            it('should fail by default', function() {
                assert.throws(function() {
                    parse('$a', {
                        context: 'value'
                    });
                }, /Unexpected input/);
            });

            it('should parse when extended', function() {
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
            var extended = new Parser();
            extended.readSequenceSelectorFallback = function() {
                if (this.scanner.tokenType === TYPE.Ampersand) {
                    var start = this.scanner.tokenStart;
                    this.scanner.next();

                    return {
                        type: 'Nested',
                        loc: this.getLocation(start, this.scanner.tokenEnd)
                    };
                }
            };

            it('should fail by default', function() {
                assert.throws(function() {
                    parse('a &', {
                        context: 'selector'
                    });
                }, /Unexpected input/);
            });

            it('should parse when extended', function() {
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
                        context: 'value'
                    });
                }, /Unexpected input/);
            });
        });
    });
});
