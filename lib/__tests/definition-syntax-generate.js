import assert from 'assert';
import { lexer, definitionSyntax } from 'css-tree';
import { tests } from './fixture/definition-syntax.js';

const { parse, generate } = definitionSyntax;
const assertGenerateParseRoundTrip = (syntax) => assert.deepStrictEqual(parse(generate(syntax)), syntax);

function createParseGenerateTest(test) {
    it(test.source + (test.generate ? ' → ' + test.generate : ''), () => {
        const actual = generate(parse(test.source));

        assert.strictEqual(actual, test.generate || test.source);
    });
}

describe('definitionSyntax.generate()', () => {
    it('should throw an exception on bad node type', () =>
        assert.throws(
            () => generate({ type: 'Unknown' }),
            /Error: Unknown node type `Unknown`/
        )
    );

    describe('round trip', () => {
        describe('multiplers', () =>
            [
                { source: '<number>' },
                { source: '<number>*' },
                { source: '<number>?' },
                { source: '<number>+' },
                { source: '<number>#' },
                { source: '<number>#{2,3}' },
                { source: '<number>{2}' },
                { source: '<number>{2,}' },
                { source: '<number>{2,3}' },
                { source: '<number>{0,}', generate: '<number>*' },
                { source: '<number>{1,}', generate: '<number>+' },
                { source: '<number>{2,2}', generate: '<number>{2}' },
                { source: '[ <number> ]' },
                { source: '[ <number> ]?' },
                { source: '[ <number> ]*' },
                { source: '[ <number> ]+' },
                { source: '[ <number> ]#' },
                { source: '[ <number> ]#{1,2}' },
                { source: '[ <number> ]!' },
                { source: '[ <number> ]!{1,2}' },
                { source: '[ <number> ]!#{1,2}' }
            ].forEach(createParseGenerateTest)
        );

        describe('bracketed range notation', () =>
            [
                { source: '<number>' },
                { source: '<number [1,2]>' },
                { source: '<number [-∞,2]>' },
                { source: '<number [1,∞]>' },
                { source: '<number [-∞,∞]>', generate: '<number [-∞,∞]>' },
                { source: '<number[1,2]>', generate: '<number [1,2]>' },
                { source: '<number [1 , 2]>', generate: '<number [1,2]>' }
            ].forEach(createParseGenerateTest)
        );

        describe('fixture', () => {
            for (const testFile of Object.values(tests)) {
                for (const test of Object.values(testFile)) {
                    if (!test.syntax) {
                        continue;
                    }

                    it(test.name, () => {
                        const actual = generate(parse(test.syntax)).replace(/\s+,/g, ',');
                        const expected = test.syntax.replace(/\s+,/g, ',');

                        assert.strictEqual(actual, expected);
                    });
                }
            }
        });

        describe('lexer dictionary', () => {
            for (const section of ['properties', 'types']) {
                for (const [name, definition] of Object.entries(lexer[section])) {
                    if (definition.serializable) {
                        it(`${section}/${name}`, () =>
                            assertGenerateParseRoundTrip(definition.syntax)
                        );
                    }
                }
            }

            for (const [name, definition] of Object.entries(lexer.atrules)) {
                describe(`atrules/${name}`, () => {
                    if (definition.prelude !== null) {
                        it('prelude', () =>
                            assertGenerateParseRoundTrip(definition.prelude.syntax)
                        );
                    }

                    if (definition.descriptors) {
                        describe('definitions', () => {
                            for (const name in definition.descriptors) {
                                it(name, () =>
                                    assertGenerateParseRoundTrip(definition.descriptors[name].syntax)
                                );
                            }
                        });
                    }
                });
            }
        });
    });

    it('using forceBraces', () => {
        const ast = parse('a b   |   c ||   d &&   e f');
        const actual = generate(ast, { forceBraces: true });
        const expected = '[ [ a b ] | [ c || [ d && [ e f ] ] ] ]';

        assert.strictEqual(actual, expected);
    });

    describe('using decorate', () => {
        it('basic', () => {
            const ast = parse('<foo> && <bar>');
            const expected = '*{<foo>} && {<bar>}*';
            const actual = generate(ast, (str, node) => {
                switch (node.type) {
                    case 'Type':
                        return '{' + str + '}';

                    case 'Group':
                        return '*' + str + '*';

                    default:
                        return str;
                }
            });

            assert.strictEqual(actual, expected);
        });

        it('all the node types', () => {
            const ast = parse('<foo> && <\'bar\'> | [ ( a+, b( \'c\' / <d>#{1,2} ) ) ]!');
            const expected = '{Group}{Group}{Type}<foo>{/Type} && {Property}<\'bar\'>{/Property}{/Group} | {Group}[ {Token}({/Token} {Keyword}a{/Keyword}{Multiplier}+{/Multiplier} {Comma},{/Comma} {Function}b({/Function} {String}\'c\'{/String} {Token}/{/Token} {Type}<d>{/Type}{Multiplier}#{1,2}{/Multiplier} {Token}){/Token} {Token}){/Token} ]!{/Group}{/Group}';
            const actual = generate(ast, (str, node) => {
                return '{' + node.type + '}' + str + '{/' + node.type + '}';
            });

            assert.strictEqual(actual, expected);
        });
    });
});
