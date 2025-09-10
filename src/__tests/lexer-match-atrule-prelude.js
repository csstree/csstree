import assert from 'assert';
import { parse, lexer, fork } from 'css-tree';
import { lazyValues, cssWideKeywords } from './helpers/index.js';
import { forEachAtrulePreludeTest } from './fixture/definition-syntax.js';

const values = lazyValues({
    animationName: () => parse('animation-name', { context: 'atrulePrelude', atrule: 'keyframes' }),
    number: () => parse('123', { context: 'atrulePrelude', atrule: 'unknown' }),
    customSyntax: () => fork({
        atrules: {
            '-foo-keyframes': {
                prelude: '<number>'
            }
        }
    })
});

describe('Lexer#matchAtrulePrelude()', () => {
    it('should match', () => {
        const match = values.customSyntax.lexer.matchAtrulePrelude('keyframes', values.animationName);

        assert(match.matched);
        assert.strictEqual(match.error, null);
    });

    describe('vendor prefixes', () => {
        it('vendor prefix', () => {
            const match = values.customSyntax.lexer.matchAtrulePrelude('-webkit-keyframes', values.animationName);

            assert(match.matched);
            assert.strictEqual(match.error, null);
        });

        it('case insensetive with vendor prefix', () => {
            let match;

            match = values.customSyntax.lexer.matchAtrulePrelude('KEYFRAMES', values.animationName);
            assert(match.matched);
            assert.strictEqual(match.error, null);

            match = values.customSyntax.lexer.matchAtrulePrelude('-VENDOR-Keyframes', values.animationName);
            assert(match.matched);
            assert.strictEqual(match.error, null);
        });

        it('should use verdor version first', () => {
            let match;

            match = values.customSyntax.lexer.matchAtrulePrelude('-foo-keyframes', values.number);
            assert(match.matched);
            assert.strictEqual(match.error, null);

            match = values.customSyntax.lexer.matchAtrulePrelude('keyframes', values.number);
            assert.strictEqual(match.matched, null);
            assert.strictEqual(match.error.message, 'Mismatch\n  syntax: <keyframes-name>\n   value: 123\n  --------^');
        });
    });

    it('should not be matched to empty value', () => {
        const match = lexer.matchAtrulePrelude('keyframes', parse('', { context: 'atrulePrelude', positions: true }));

        assert.strictEqual(match.matched, null);
        assert.strictEqual(match.error.rawMessage, 'Mismatch');
        assert.deepStrictEqual({
            line: match.error.line,
            column: match.error.column
        }, {
            line: 1,
            column: 1
        });
    });

    it('should be positive when no prelude and at-rule has no prelude', () => {
        const match = lexer.matchAtrulePrelude('font-face', null);

        assert.strictEqual(match.matched, null);
        assert.strictEqual(match.error, null);
    });

    describe('should not match css wide keywords', function() {
        for (const keyword of cssWideKeywords) {
            it(keyword, () => {
                const match = lexer.matchAtrulePrelude('import', parse(keyword, { context: 'atrulePrelude', positions: true }));

                assert.strictEqual(match.matched, null);
                assert.strictEqual(match.error.rawMessage, 'Mismatch');
            });
        }
    });

    describe('should not be matched to at-rules with no prelude', () => {
        it('regular name', () => {
            const match = lexer.matchAtrulePrelude('font-face', values.animationName);

            assert.strictEqual(match.matched, null);
            assert.strictEqual(match.error.message, 'At-rule `@font-face` should not contain a prelude');
        });

        it('with verdor prefix', () => {
            const match = lexer.matchAtrulePrelude('-prefix-font-face', values.animationName);

            assert.strictEqual(match.matched, null);
            assert.strictEqual(match.error.message, 'At-rule `@-prefix-font-face` should not contain a prelude');
        });
    });

    describe('should not fail when prelude is not specified and syntax allows it', () => {
        const nullMatch = {
            match: [],
            syntax: {
                name: 'page',
                type: 'AtrulePrelude'
            }
        };

        for (const prelude of ['', null, undefined]) {
            it(String(prelude), () => {
                const actual = lexer.matchAtrulePrelude('page', prelude);

                assert.strictEqual(actual.error, null);
                assert.deepStrictEqual(actual.matched, nullMatch);
            });
        }
    });

    forEachAtrulePreludeTest((testType, testState, name, lexer, atruleName, value) => {
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
                    const allowedErrors = ['SyntaxMatchError', 'SyntaxError'];

                    assert.strictEqual(match.matched, null, 'should NOT MATCH to "' + value + '"');
                    assert.strictEqual(allowedErrors.includes(match.error.name), true, 'should be one of ' + JSON.stringify(allowedErrors));
                });
                break;
        }
    });
});
