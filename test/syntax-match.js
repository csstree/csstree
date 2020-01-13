const assert = require('assert');
const prepareTokens = require('../lib/lexer/prepare-tokens');
const genericSyntaxes = require('../lib/lexer/generic');
const { buildMatchGraph } = require('../lib/lexer/match-graph');
const { matchAsList, matchAsTree } = require('../lib/lexer/match');
const fixture = require('./fixture/syntax-match');

function processMatchResult(mr) {
    if (Array.isArray(mr)) {
        const array = mr.map(processMatchResult);
        return array.length === 1 ? array[0] : array;
    }

    if (mr.token) {
        return mr.token;
    }

    if (mr.syntax && mr.match) {
        return {
            syntax: mr.syntax.type === 'Type'
                ? '<' + mr.syntax.name + '>'
                : mr.syntax.type === 'Property'
                    ? '<\'' + mr.syntax.name + '\'>'
                    : mr.syntax.name,
            match: processMatchResult(mr.match)
        };
    }
}

function createSyntaxTest(testName, test) {
    const syntax = test.syntax || testName;
    const matchTree = buildMatchGraph(syntax);
    const syntaxes = { types: {}, properties: {} };

    for (const name in genericSyntaxes) {
        syntaxes.types[name] = {
            match: buildMatchGraph(genericSyntaxes[name])
        };
    }

    for (const name in test.types) {
        syntaxes.types[name] = {
            match: buildMatchGraph(test.types[name])
        };
    }

    for (const name in test.properties) {
        syntaxes.properties[name] = {
            match: buildMatchGraph(test.properties[name])
        };
    }

    (describe[test.test] || describe)(test.name || testName, () => {
        if (test.valid) {
            test.valid.forEach(input => {
                it(`should MATCH to "${input}"`, () => {
                    const m = matchAsList(prepareTokens(input), matchTree, syntaxes);

                    assert.notEqual(m.match, null);
                    assert.deepEqual(
                        m.match
                            .map(x => x.token)
                            .filter(x => x !== undefined),
                        m.tokens
                            .map(x => x.value)
                            .filter(s => /\S/.test(s))
                    );
                });
            });
        }

        if (test.invalid) {
            test.invalid.forEach(input => {
                it(`should NOT MATCH to "${input}"`, () => {
                    const m = matchAsList(prepareTokens(input), matchTree, syntaxes);

                    assert.equal(m.match, null);
                });
            });
        }

        if (test.matchResult) {
            Object.keys(test.matchResult).forEach(input => {
                const matchResult = test.matchResult[input];

                it(`match result for "${input}"`, () => {
                    const m = matchAsTree(prepareTokens(input), matchTree, syntaxes);

                    assert.deepEqual(processMatchResult(m.match.match), matchResult);
                });
            });
        }
    });
}

describe('syntax matching', () => {
    fixture.forEachTest(createSyntaxTest);

    it('should raise an error on broken type reference', () => {
        const matchTree = buildMatchGraph('<foo>');

        assert.throws(
            () => matchAsList(prepareTokens('foo'), matchTree, {}),
            /Bad syntax reference: <foo>/
        );
    });

    it('should raise an error on broken property reference', () => {
        const matchTree = buildMatchGraph('<\'foo\'>');

        assert.throws(
            () => matchAsList(prepareTokens('foo'), matchTree, {}),
            /Bad syntax reference: <\'foo\'>/
        );
    });
});
