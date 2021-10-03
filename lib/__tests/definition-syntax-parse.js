import assert from 'assert';
import { lexer, definitionSyntax } from 'css-tree';

const { parse } = definitionSyntax;

describe('definitionSyntax.parse()', () => {
    describe('combinator precedence', () => {
        const combinators = [' ', '&&', '||', '|']; // higher goes first
        const print = node => {
            return node.type === 'Group'
                ? `(${node.terms.map(print).join(node.combinator)})`
                : node.name;
        };

        for (const hi of combinators) {
            for (const lo of combinators.slice(combinators.indexOf(hi) + 1)) {
                describe(`"${hi}" vs. "${lo}"`, () => {
                    const hilo = `a${hi}b${lo}c`;
                    it(hilo, () => {
                        const ast = parse(hilo);
                        assert.strictEqual(print(ast), `((a${hi}b)${lo}c)`);
                    });

                    const lohi = `a${lo}b${hi}c`;
                    it(lohi, () => {
                        const ast = parse(lohi);
                        assert.strictEqual(print(ast), `(a${lo}(b${hi}c))`);
                    });
                });
            }
        }
    });

    describe('bad syntax', () => {
        it('expected a quote', () =>
            assert.throws(
                () => parse('\'x'),
                /^SyntaxError: Expect an apostrophe\n/
            )
        );

        describe('expected a number', () => {
            const tests = [
                '<x>{}',
                '<x>{,2}',
                '<x>{ 2}',
                '<x>{1, }'
            ];

            for (const test of tests) {
                it(test, () =>
                    assert.throws(
                        () => parse(test),
                        /^SyntaxError: Expect a number\n/
                    )
                );
            }
        });

        describe('missed keyword', () => {
            const tests = [
                '<>',
                '<\'\'>'
            ];

            for (const test of tests) {
                it(test, () =>
                    assert.throws(
                        () => parse(test),
                        /^SyntaxError: Expect a keyword\n/
                    )
                );
            }
        });

        describe('unexpected combinator', () => {
            const tests = [
                '<x>&&',
                '&&<x>',
                '<x>&&||'
            ];

            for (const test of tests) {
                it(test, () =>
                    assert.throws(
                        () => parse(test),
                        /^SyntaxError: Unexpected combinator\n/
                    )
                );
            }
        });

        describe('unexpected input', () => {
            const tests = [
                '#',
                '?',
                '+',
                '*',
                '!',
                '[]]',
                '{1}'
            ];

            for (const test of tests) {
                it(test, () =>
                    assert.throws(
                        () => parse(test),
                        /^SyntaxError: Unexpected input\n/
                    )
                );
            }
        });

        describe('bad syntax', () => {
            const tests = [
                'a&b',
                '<a',
                '[a'
            ];

            for (const test of tests) {
                it(test, () =>
                    assert.throws(
                        () => parse(test),
                        /^SyntaxError: Expect `.`\n/
                    )
                );
            }
        });
    });

    // FIXME: in fact this test checks lexer's dictionaries, since lexer uses
    // parse under the hood when first access to definition's "syntax" property;
    // Problems:
    // - test has side effect, because access to syntax trigger parsing and cache the result
    // - some other tests can init syntax
    // - dictionary can move or store actual ast and don't use parsing et all
    // - etc.
    describe('parse', () => {
        for (const section of ['properties', 'types']) {
            for (const [name, definition] of Object.entries(lexer[section])) {
                if (definition.serializable) {
                    it(`${section}/${name}`, () => {
                        assert.strictEqual(definition.syntax.type, 'Group');
                    });
                }
            }
        }

        for (const [name, definition] of Object.entries(lexer.atrules)) {
            describe(`atrules/${name}`, () => {
                if (definition.prelude !== null) {
                    it('prelude', () => assert.strictEqual(definition.prelude.syntax.type, 'Group'));
                }

                if (definition.descriptors) {
                    describe('definitions', () => {
                        for (const name in definition.descriptors) {
                            it(name, () => assert.strictEqual(definition.descriptors[name].syntax.type, 'Group'));
                        }
                    });
                }
            });
        }
    });
});
