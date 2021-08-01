import assert from 'assert';
import importLib from './helpers/lib.js';

const DollarSign = 0x0024; // U+0024 DOLLAR SIGN ($)
const Ampersand = 0x0026;  // U+0026 ANPERSAND (&)

describe('extension', async () => {
    const { parse, tokenize: { TYPE }, toPlainObject, fork } = await importLib();

    describe('value', () => {
        const extended = fork(syntaxConfig => {
            const defaultGetNode = syntaxConfig.scope.Value.getNode;

            syntaxConfig.scope.Value.getNode = function(context) {
                if (this.isDelim(DollarSign)) {
                    const start = this.tokenStart;
                    this.next();

                    return {
                        type: 'Variable',
                        loc: this.getLocation(start, this.tokenEnd),
                        name: this.consume(TYPE.Ident)
                    };
                }

                return defaultGetNode.call(this, context);
            };

            return syntaxConfig;
        });

        it('should not affect base syntax', () => {
            assert.throws(
                () => parse('$a', { context: 'value' }),
                /Unexpected input/
            );
        });

        it('should parse according new rules', () => {
            const ast = extended.parse('$a', {
                context: 'value'
            });

            assert.deepStrictEqual(toPlainObject(ast), {
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

        it('should fail on unknown', () => {
            assert.throws(
                () => extended.parse('@a', { context: 'value' }),
                /Unexpected input/
            );
        });
    });

    describe('selector', () => {
        const extended = fork(syntaxConfig => {
            const defaultGetNode = syntaxConfig.scope.Selector.getNode;

            syntaxConfig.scope.Selector.getNode = function(context) {
                if (this.isDelim(Ampersand)) {
                    const start = this.tokenStart;
                    this.next();

                    return {
                        type: 'Nested',
                        loc: this.getLocation(start, this.tokenEnd)
                    };
                }

                return defaultGetNode.call(this, context);
            };

            return syntaxConfig;
        });

        it('should not affect base syntax', () => {
            assert.throws(
                () => parse('a &', { context: 'selector' }),
                /Unexpected input/
            );
        });

        it('should parse according new rules', () => {
            const ast = extended.parse('a &', {
                context: 'selector'
            });

            assert.deepStrictEqual(toPlainObject(ast), {
                type: 'Selector',
                loc: null,
                children: [
                    {
                        type: 'TypeSelector',
                        loc: null,
                        name: 'a'
                    },
                    {
                        type: 'Combinator',
                        loc: null,
                        name: ' '
                    },
                    {
                        type: 'Nested',
                        loc: null
                    }
                ]
            });
        });

        it('should fail on unknown', () => {
            assert.throws(
                () => extended.parse('@a', { context: 'selector' }),
                /Selector is expected/
            );
        });
    });
});
