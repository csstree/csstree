import assert from 'assert';
import fs from 'fs';
import { parse, walk, List } from 'css-tree';
import { forEachTest as forEachAstTest } from './fixture/ast.js';
import { tokenTypes, tokenNames, OffsetToLocation, TokenStream, tokenize } from '../tokenizer/index.js';

const genericTypesFixture = JSON.parse(fs.readFileSync('./fixtures/definition-syntax-match/generic.json'));
const stringifyWithNoLoc = ast => JSON.stringify(ast, (key, value) => key !== 'loc' ? value : undefined, 4);

function createParseErrorTest(name, test, options) {
    (test.skip ? it.skip : it)(`${name} ${JSON.stringify(test.source)}`, () => {
        let error;

        assert.throws(
            () => parse(test.source, options),
            (e) => {
                error = e;
                if (e instanceof parse.SyntaxError === false) {
                    return true;
                }
            },
            'Should be a CSS parse error'
        );

        assert.strictEqual(error.message, test.error);
        assert.deepStrictEqual({
            offset: error.offset,
            line: error.line,
            column: error.column
        }, test.position);
    });
}

describe('parse', () => {
    describe('basic', () => {
        forEachAstTest((name, test) => {
            (test.skip ? it.skip : it)(name, () => {
                const ast = parse(test.source, test.options);

                // AST should be equal
                assert.strictEqual(stringifyWithNoLoc(ast), stringifyWithNoLoc(test.ast));
            });
        });

        describe('AnPlusB', () => {
            const fixture = genericTypesFixture['<an-plus-b>'];

            fixture.valid.forEach(value => {
                it(value, () => {
                    const actual = parse(':nth-child(' + value + ')', { context: 'selector' }).children.first.children.first.nth;
                    const a = value.match(/^([+-]?)(\d+)?n/i);
                    const b = value.match(/([+-]?)\s*(\d+)$/);
                    const expected = {
                        type: 'AnPlusB',
                        a: a ? (a[1] === '-' ? '-' : '') + (a[2] || '1') : null,
                        b: b ? (b[1] === '-' ? '-' : '') + b[2] : null
                    };

                    // AST should be equal
                    assert.strictEqual(stringifyWithNoLoc(actual), stringifyWithNoLoc(expected));
                });
            });

            fixture.invalid
                .filter(value => value !== '')
                .forEach(value =>
                    it(value, () =>
                        assert.throws(
                            () => parse(':nth-child(' + value + ')', { context: 'selector' })
                        )
                    )
                );
        });

        describe('UnicodeRange', () => {
            const fixture = genericTypesFixture['<urange>'];

            fixture.valid.forEach(value => {
                it(value, () => {
                    const actual = parse(value, { context: 'value' }).children.first;
                    const expected = {
                        type: 'UnicodeRange',
                        value
                    };

                    // AST should be equal
                    assert.strictEqual(stringifyWithNoLoc(actual), stringifyWithNoLoc(expected));
                });
            });

            fixture.invalid.forEach(value => {
                it(value, () => {
                    assert.throws(() => {
                        const actual = parse(value, { context: 'value' });
                        const expected = {
                            type: 'Value',
                            children: [{
                                type: 'Raw',
                                value
                            }]
                        };

                        // AST should not be equal
                        assert.strictEqual(stringifyWithNoLoc(actual), stringifyWithNoLoc(expected));
                    });
                });
            });
        });
    });

    describe('context', () => {
        it('should take parse context', () => {
            assert.deepStrictEqual(parse('property: value'), {
                type: 'StyleSheet',
                loc: null,
                children: new List().appendData({
                    type: 'Raw',
                    loc: null,
                    value: 'property: value'
                })
            });

            assert.deepStrictEqual(parse('property: value', {
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

        it('wrong context', () => {
            assert.throws(() => {
                parse('a{}', { context: 'unknown' });
            }, /Unknown context `unknown`/);
        });
    });

    it('should call onParseError when handler is passed', () => {
        const errors = [];
        const ast = parse('{a: 1!; foo; b: 2}', {
            context: 'block',
            onParseError: (error, fallbackNode) => errors.push({ error, fallbackNode })
        });

        assert.strictEqual(ast.children.size, 3);
        assert.strictEqual(errors.length, 2);
        assert.strictEqual(errors[0].error.message, 'Identifier is expected');
        assert.strictEqual(errors[0].fallbackNode.value, 'a: 1!;');
        assert.strictEqual(errors[1].error.message, 'Colon is expected');
        assert.strictEqual(errors[1].fallbackNode.value, 'foo;');
    });

    describe('errors', () => {
        const throwOnParseErrorOptions = {
            onParseError: e => {
                throw e;
            }
        };

        forEachAstTest((name, test) => {
            createParseErrorTest(name, test, {
                ...test.options,
                positions: false
            });
            createParseErrorTest(name + ' (with positions)', test, {
                ...test.options,
                positions: true
            });
        }, true);

        it('formattedMessage', () => {
            assert.throws(
                () => parse('/**/\n.\nfoo', throwOnParseErrorOptions),
                (e) => {
                    assert.strictEqual(e.formattedMessage,
                        'Parse error: Identifier is expected\n' +
                        '    1 |/**/\n' +
                        '    2 |.\n' +
                        '--------^\n' +
                        '    3 |foo'
                    );
                    assert.strictEqual(e.sourceFragment(),
                        '    2 |.\n' +
                        '--------^'
                    );
                    assert.strictEqual(e.sourceFragment(3),
                        '    1 |/**/\n' +
                        '    2 |.\n' +
                        '--------^\n' +
                        '    3 |foo'
                    );

                    return true;
                }
            );
        });

        it('formattedMessage at eof', () => {
            assert.throws(
                () => parse('.', throwOnParseErrorOptions),
                (e) => {
                    assert.strictEqual(e.formattedMessage,
                        'Parse error: Identifier is expected\n' +
                        '    1 |.\n' +
                        '--------^'
                    );

                    return true;
                }
            );
        });

        it('formattedMessage (windows new lines)', () => {
            assert.throws(
                () => parse('/**/\r\n.\r\nfoo', throwOnParseErrorOptions),
                (e) => {
                    assert.strictEqual(e.formattedMessage,
                        'Parse error: Identifier is expected\n' +
                        '    1 |/**/\n' +
                        '    2 |.\n' +
                        '--------^\n' +
                        '    3 |foo'
                    );
                    assert.strictEqual(e.sourceFragment(),
                        '    2 |.\n' +
                        '--------^'
                    );
                    assert.strictEqual(e.sourceFragment(3),
                        '    1 |/**/\n' +
                        '    2 |.\n' +
                        '--------^\n' +
                        '    3 |foo'
                    );

                    return true;
                }
            );
        });

        it('formattedMessage with tabs', () => {
            assert.throws(() => {
                parse('a {\n\tb:\tc#\t\n}', throwOnParseErrorOptions);
            }, function(e) {
                assert.strictEqual(e.formattedMessage,
                    'Parse error: Hex or identifier is expected\n' +
                    '    1 |a {\n' +
                    '    2 |    b:    c#    \n' +
                    '-------------------^\n' +
                    '    3 |}'
                );

                return true;
            });
        });

        it('formattedMessage for source with long lines', () => {
            assert.throws(
                () => parse(
                    '/*' + '1234567890'.repeat(20) + '*/\n' +
                    ' '.repeat(117) + '.\n' +
                    'foo\n' +
                    ' '.repeat(120) + 'bar',
                    throwOnParseErrorOptions
                ),
                (e) => {
                    assert.strictEqual(e.formattedMessage,
                        'Parse error: Identifier is expected\n' +
                        '    1 |…12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678…\n' +
                        '    2 |…                                                       .\n' +
                        '----------------------------------------------------------------^\n' +
                        '    3 |\n' +
                        '    4 |…                                                          bar'
                    );

                    return true;
                }
            );
        });

        it('with custom offset/line/column', () => {
            assert.throws(
                () => parse(
                    '#.classname\n\n\n',
                    { context: 'selector', positions: true, offset: 10, line: 10, column: 10 }
                ),
                (e) => {
                    assert.strictEqual(e.formattedMessage,
                        'Parse error: Name is expected\n' +
                        '   10 |         #.classname\n' +
                        '-----------------^'
                    );
                    assert.deepStrictEqual({
                        source: '#.classname\n\n\n',
                        offset: 11,
                        line: 10,
                        column: 11
                    }, {
                        source: e.source,
                        offset: e.offset,
                        line: e.line,
                        column: e.column
                    });

                    return true;
                }
            );
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

            assert.deepStrictEqual(actual, [
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

            assert.deepStrictEqual(actual, [
                { value: '123', loc: loc(0, 7) },
                { value: ' 234 ', loc: loc(14, 23) },
                { value: ' 345', loc: loc(41, 49) },
                { value: '567*', loc: loc(83, 89) }
            ]);
        });
    });

    describe('onToken', () => {
        const source = '/*123*/.foo[a=/* 234 */] {\n  color: red;} /*567*';
        const expected = [
            { type: tokenTypes.Comment, start: 0, end: 7 },
            { type: tokenTypes.Delim, start: 7, end: 8 },
            { type: tokenTypes.Ident, start: 8, end: 11 },
            { type: tokenTypes.LeftSquareBracket, start: 11, end: 12 },
            { type: tokenTypes.Ident, start: 12, end: 13 },
            { type: tokenTypes.Delim, start: 13, end: 14 },
            { type: tokenTypes.Comment, start: 14, end: 23 },
            { type: tokenTypes.RightSquareBracket, start: 23, end: 24 },
            { type: tokenTypes.WhiteSpace, start: 24, end: 25 },
            { type: tokenTypes.LeftCurlyBracket, start: 25, end: 26 },
            { type: tokenTypes.WhiteSpace, start: 26, end: 29 },
            { type: tokenTypes.Ident, start: 29, end: 34 },
            { type: tokenTypes.Colon, start: 34, end: 35 },
            { type: tokenTypes.WhiteSpace, start: 35, end: 36 },
            { type: tokenTypes.Ident, start: 36, end: 39 },
            { type: tokenTypes.Semicolon, start: 39, end: 40 },
            { type: tokenTypes.RightCurlyBracket, start: 40, end: 41 },
            { type: tokenTypes.WhiteSpace, start: 41, end: 42 },
            { type: tokenTypes.Comment, start: 42, end: 48 }
        ];

        it('as function', () => {
            const actual = [];
            parse(source, {
                onToken(type, start, end, index) {
                    actual.push({ type, start, end, index });
                }
            });

            assert.deepStrictEqual(actual, expected.map((token, index) => ({
                index,
                ...token
            })));
        });

        it('as function with API', () => {
            const filename = 'test.css';
            const offsetToLocation = new OffsetToLocation(source);
            const tokenStream = new TokenStream(source, tokenize);
            const actual = [];

            parse(source, {
                filename,
                onToken(type, start, end, index) {
                    actual.push({
                        index,
                        filename: this.filename,
                        source: this.source,
                        tokenCount: this.tokenCount,
                        type: this.getTokenType(index),
                        typeName: this.getTokenTypeName(index),
                        isBlockOpenerTokenType: this.isBlockOpenerTokenType(type),
                        isBlockCloserTokenType: this.isBlockCloserTokenType(type),
                        balance: this.balance[index],
                        blockTokenPairIndex: this.getBlockTokenPairIndex(index),
                        start: this.getTokenStart(index),
                        end: this.getTokenEnd(index),
                        value: this.getTokenValue(index),
                        substring: this.substring(start, end),
                        location: this.getLocation(start),
                        rangeLocation: this.getRangeLocation(start, end)
                    });
                }
            });

            assert.deepStrictEqual(actual, expected.map((token, index) => ({
                index,
                filename,
                source,
                tokenCount: tokenStream.tokenCount,
                typeName: tokenNames[token.type],
                isBlockOpenerTokenType: [tokenTypes.Function, tokenTypes.LeftParenthesis, tokenTypes.LeftSquareBracket, tokenTypes.LeftCurlyBracket].includes(token.type),
                isBlockCloserTokenType: [tokenTypes.RightParenthesis, tokenTypes.RightSquareBracket, tokenTypes.RightCurlyBracket].includes(token.type),
                balance: tokenStream.balance[index],
                blockTokenPairIndex: tokenStream.getBlockTokenPairIndex(index),
                value: source.substring(token.start, token.end),
                substring: source.substring(token.start, token.end),
                location: offsetToLocation.getLocation(token.start, filename),
                rangeLocation: offsetToLocation.getLocationRange(token.start, token.end, filename),
                ...token
            })));
        });

        it('as array', () => {
            const actual = [];
            parse(source, {
                onToken: actual
            });

            assert.deepStrictEqual(actual, expected);
        });

    });

    describe('positions', () => {
        it('should start with line 1 column 1 by default', () => {
            const positions = [];
            const ast = parse('.foo.bar {\n  property: value 123 123.4 .123 123px 99% #fff url( a ) / var( --a ), "test" \'test\';\n}', {
                positions: true
            });

            walk(ast, node => {
                if (node.loc) {
                    positions.push([
                        node.loc.start.offset,
                        node.loc.start.line,
                        node.loc.start.column,
                        node.type
                    ]);
                }
            });

            assert.deepStrictEqual(positions, [
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
                [68, 2, 58, 'Operator'],
                [70, 2, 60, 'Function'],
                [75, 2, 65, 'Identifier'],
                [80, 2, 70, 'Operator'],
                [82, 2, 72, 'String'],
                [89, 2, 79, 'String']
            ]);
        });

        it('should start with specified offset, line and column', () => {
            const positions = [];
            const ast = parse('.foo.bar {\n  property: value 123 123.4 .123 123px 99% #fff url( a ) / var( --a ), "test" \'test\';\n}', {
                positions: true,
                offset: 100,
                line: 3,
                column: 5
            });

            walk(ast, node => {
                if (node.loc) {
                    positions.push([
                        node.loc.start.offset,
                        node.loc.start.line,
                        node.loc.start.column,
                        node.type
                    ]);
                }
            });

            assert.deepStrictEqual(positions, [
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
                [168, 4, 58, 'Operator'],
                [170, 4, 60, 'Function'],
                [175, 4, 65, 'Identifier'],
                [180, 4, 70, 'Operator'],
                [182, 4, 72, 'String'],
                [189, 4, 79, 'String']
            ]);
        });
    });
});
