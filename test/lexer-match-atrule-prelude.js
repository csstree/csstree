const assert = require('assert');
const { parse, lexer, fork } = require('../lib');
const fixture = require('./fixture/syntax');

describe('Lexer#matchAtrulePrelude()', () => {
    const animationName = parse('animation-name', { context: 'atrulePrelude', atrule: 'keyframes' });
    const number = parse('123', { context: 'atrulePrelude', atrule: 'unknown' });
    const customSyntax = fork({
        atrules: {
            '-foo-keyframes': {
                prelude: '<number>'
            }
        }
    });

    it('should match', () => {
        const match = customSyntax.lexer.matchAtrulePrelude('keyframes', animationName);

        assert(match.matched);
        assert.equal(match.error, null);
    });

    describe('vendor prefixes', () => {
        it('vendor prefix', () => {
            const match = customSyntax.lexer.matchAtrulePrelude('-webkit-keyframes', animationName);

            assert(match.matched);
            assert.equal(match.error, null);
        });

        it('case insensetive with vendor prefix', () => {
            let match;

            match = customSyntax.lexer.matchAtrulePrelude('KEYFRAMES', animationName);
            assert(match.matched);
            assert.equal(match.error, null);

            match = customSyntax.lexer.matchAtrulePrelude('-VENDOR-Keyframes', animationName);
            assert(match.matched);
            assert.equal(match.error, null);
        });

        it('should use verdor version first', () => {
            let match;

            match = customSyntax.lexer.matchAtrulePrelude('-foo-keyframes', number);
            assert(match.matched);
            assert.equal(match.error, null);

            match = customSyntax.lexer.matchAtrulePrelude('keyframes', number);
            assert.equal(match.matched, null);
            assert.equal(match.error.message, 'Mismatch\n  syntax: <keyframes-name>\n   value: 123\n  --------^');
        });
    });

    it('should not be matched to empty value', () => {
        const match = lexer.matchAtrulePrelude('keyframes', parse('', { context: 'atrulePrelude', positions: true }));

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

    describe('should not be matched to at-rules with no prelude', () => {
        it('regular name', () => {
            const match = lexer.matchAtrulePrelude('font-face', animationName);

            assert.equal(match.matched, null);
            assert.equal(match.error.message, 'At-rule `font-face` should not contain a prelude');
        });

        it('with verdor prefix', () => {
            const match = lexer.matchAtrulePrelude('-prefix-font-face', animationName);

            assert.equal(match.matched, null);
            assert.equal(match.error.message, 'At-rule `-prefix-font-face` should not contain a prelude');
        });
    });

    fixture.forEachAtrulePreludeTest((testType, testState, name, lexer, atruleName, value) => {
        switch (testType) {
            case 'valid':
                (it[testState] || it)(name, () => {
                    const match = lexer.matchAtrulePrelude(atruleName, value);

                    assert(match.matched !== null, match.error && match.error.message);
                });
                break;

            case 'invalid':
                (it[testState] || it)(name, () => {
                    const match = lexer.matchAtrulePrelude(atruleName, value);

                    assert.equal(match.matched, null, 'should NOT MATCH to "' + value + '"');
                    assert.equal(match.error.name, 'SyntaxMatchError');
                });
                break;
        }
    });
});
