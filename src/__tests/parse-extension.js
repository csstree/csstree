import assert from 'assert';
import { parse, tokenTypes, toPlainObject, fork } from 'css-tree';

const DollarSign = 0x0024; // U+0024 DOLLAR SIGN ($)
const PercentageSign = 0x0025;  // U+0025 PERCENTAGE SIGN (%)

describe('extension', () => {
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
                        name: this.consume(tokenTypes.Ident)
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
                if (this.isDelim(PercentageSign)) {
                    const start = this.tokenStart;
                    this.next();

                    return {
                        type: 'Test',
                        loc: this.getLocation(start, this.tokenEnd)
                    };
                }

                return defaultGetNode.call(this, context);
            };

            return syntaxConfig;
        });

        it('should not affect base syntax', () => {
            assert.throws(
                () => parse('a %', { context: 'selector' }),
                /Unexpected input/
            );
        });

        it('should parse according new rules', () => {
            const ast = extended.parse('a %', {
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
                        type: 'Test',
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
