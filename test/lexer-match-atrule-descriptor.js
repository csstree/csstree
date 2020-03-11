const assert = require('assert');
const { parse, lexer, fork } = require('./helpers/lib');
const { lazyValues } = require('./helpers');
const fixture = require('./fixture/syntax');
const values = lazyValues({
    swapValue: () => parse('swap', { context: 'value' }),
    xxxValue: () => parse('xxx', { context: 'value' }),
    fontDisplaySyntax: () => 'auto | block | swap | fallback | optional',
    customSyntax: () => fork(prev => ({
        ...prev,
        atrules: {
            'font-face': {
                descriptors: {
                    'font-display': values.fontDisplaySyntax,
                    '-foo-font-display': `${values.fontDisplaySyntax} | xxx`
                }
            }
        }
    }))
});

describe('Lexer#matchAtruleDescriptor()', () => {
    it('should match', () => {
        const match = values.customSyntax.lexer.matchAtruleDescriptor('font-face', 'font-display', values.swapValue);

        assert(match.matched);
        assert.equal(match.error, null);
    });

    describe('vendor prefixes', () => {
        it('vendor prefix in keyword name', () => {
            const match = values.customSyntax.lexer.matchAtruleDescriptor('-prefix-font-face', 'font-display', values.swapValue);

            assert(match.matched);
            assert.equal(match.error, null);
        });

        it('vendor prefix in declarator name', () => {
            const match = values.customSyntax.lexer.matchAtruleDescriptor('font-face', '-prefix-font-display', values.swapValue);

            assert(match.matched);
            assert.equal(match.error, null);
        });

        it('case insensetive with vendor prefix', () => {
            let match;

            match = values.customSyntax.lexer.matchAtruleDescriptor('FONT-FACE', 'FONT-DISPLAY', values.swapValue);
            assert(match.matched);
            assert.equal(match.error, null);

            match = values.customSyntax.lexer.matchAtruleDescriptor('FONT-face', '-VENDOR-Font-Display', values.swapValue);
            assert(match.matched);
            assert.equal(match.error, null);
        });

        it('should use verdor version first', () => {
            let match;

            match = values.customSyntax.lexer.matchAtruleDescriptor('font-face', '-foo-font-display', values.xxxValue);
            assert(match.matched);
            assert.equal(match.error, null);

            match = values.customSyntax.lexer.matchAtruleDescriptor('font-face', 'font-display', values.xxxValue);
            assert.equal(match.matched, null);
            assert.equal(match.error.message, 'Mismatch\n  syntax: ' + values.fontDisplaySyntax + '\n   value: xxx\n  --------^');
        });
    });

    it('should not be matched to empty value', () => {
        const match = lexer.matchAtruleDescriptor('font-face', 'font-display', parse('', { context: 'value', positions: true }));

        assert.equal(match.matched, null);
        assert.equal(match.error.rawMessage, 'Mismatch');
        assert.deepEqual({
            line: match.error.line,
            column: match.error.column
        }, {
            line: 1,
            column: 1
        });
    });

    it('should not be matched to at-rules with no descriptors', () => {
        const match = lexer.matchAtruleDescriptor('keyframes', 'font-face', values.swapValue);

        assert.equal(match.matched, null);
        assert.equal(match.error.message, 'At-rule `keyframes` has no known descriptors');
    });

    fixture.forEachAtruleDescriptorTest((testType, testState, name, lexer, atruleName, descriptorName, value) => {
        switch (testType) {
            case 'valid':
                (it[testState] || it)(name, () => {
                    const match = lexer.matchAtruleDescriptor(atruleName, descriptorName, value);

                    assert(match.matched !== null, match.error && match.error.message);
                });
                break;

            case 'invalid':
                (it[testState] || it)(name, () => {
                    const match = lexer.matchAtruleDescriptor(atruleName, descriptorName, value);

                    assert.equal(match.matched, null, 'should NOT MATCH to "' + value + '"');
                    assert.equal(match.error.name, 'SyntaxMatchError');
                });
                break;
        }
    });
});
