const assert = require('assert');
const { parse, lexer, fork } = require('../lib');
const fixture = require('./fixture/syntax');

describe('Lexer#matchAtruleDescriptor()', () => {
    const swapValue = parse('swap', { context: 'value' });
    const xxxValue = parse('xxx', { context: 'value' });
    const fontDisplaySyntax = 'auto | block | swap | fallback | optional';
    const customSyntax = fork(prev => ({
        ...prev,
        atrules: {
            'font-face': {
                descriptors: {
                    'font-display': fontDisplaySyntax,
                    '-foo-font-display': `${fontDisplaySyntax} | xxx`
                }
            }
        }
    }));

    it('should match', () => {
        const match = customSyntax.lexer.matchAtruleDescriptor('font-face', 'font-display', swapValue);

        assert(match.matched);
        assert.equal(match.error, null);
    });

    describe('vendor prefixes', () => {
        it('vendor prefix in keyword name', () => {
            const match = customSyntax.lexer.matchAtruleDescriptor('-prefix-font-face', 'font-display', swapValue);

            assert(match.matched);
            assert.equal(match.error, null);
        });

        it('vendor prefix in declarator name', () => {
            const match = customSyntax.lexer.matchAtruleDescriptor('font-face', '-prefix-font-display', swapValue);

            assert(match.matched);
            assert.equal(match.error, null);
        });

        it('case insensetive with vendor prefix', () => {
            let match;

            match = customSyntax.lexer.matchAtruleDescriptor('FONT-FACE', 'FONT-DISPLAY', swapValue);
            assert(match.matched);
            assert.equal(match.error, null);

            match = customSyntax.lexer.matchAtruleDescriptor('FONT-face', '-VENDOR-Font-Display', swapValue);
            assert(match.matched);
            assert.equal(match.error, null);
        });

        it('should use verdor version first', () => {
            let match;

            match = customSyntax.lexer.matchAtruleDescriptor('font-face', '-foo-font-display', xxxValue);
            assert(match.matched);
            assert.equal(match.error, null);

            match = customSyntax.lexer.matchAtruleDescriptor('font-face', 'font-display', xxxValue);
            assert.equal(match.matched, null);
            assert.equal(match.error.message, 'Mismatch\n  syntax: ' + fontDisplaySyntax + '\n   value: xxx\n  --------^');
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
        const match = lexer.matchAtruleDescriptor('keyframes', 'font-face', swapValue);

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
