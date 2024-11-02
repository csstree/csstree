import assert from 'assert';
import { lexer } from 'css-tree';
import prepareTokens from '../lexer/prepare-tokens.js';
import { createGenericTypes } from '../lexer/generic.js';
import * as units from '../lexer/units.js';
import { buildMatchGraph } from '../lexer/match-graph.js';
import { matchAsList, matchAsTree } from '../lexer/match.js';
import * as fixture from './fixture/definition-syntax-match.js';

const genericSyntaxes = createGenericTypes(units);
let defaultSyntax = null;

function getDefaultSyntax() {
    if (defaultSyntax === null) {
        const defaultTypes = Object.create(null);
        const defaultProperties = Object.create(null);

        it('create default syntax', () => {
            for (const [name, def] of Object.entries(lexer.types)) {
                defaultTypes[name] = def.match;
            }

            for (const [name, def] of Object.entries(lexer.properties)) {
                defaultProperties[name] = def.match;
            }
        });

        defaultSyntax = {
            types: defaultTypes,
            properties: defaultProperties
        };
    }

    return defaultSyntax;
}

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
    const syntaxes = test.defaultSyntaxes
        ? getDefaultSyntax()
        : { types: {}, properties: {} };

    for (const name of Object.keys(genericSyntaxes)) {
        syntaxes.types[name] = {
            match: buildMatchGraph(genericSyntaxes[name])
        };
    }

    for (const name of Object.keys(test.types || {})) {
        syntaxes.types[name] = {
            match: buildMatchGraph(test.types[name])
        };
    }

    for (const name of Object.keys(test.properties || {})) {
        syntaxes.properties[name] = {
            match: buildMatchGraph(test.properties[name])
        };
    }

    (describe[test.test] || describe)(test.name || testName, () => {
        if (test.valid) {
            test.valid.forEach(input => {
                it(`should MATCH to "${input}"`, () => {
                    const m = matchAsList(prepareTokens(input), matchTree, syntaxes);

                    assert.deepStrictEqual(
                        m.match && m.match
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

                    assert.strictEqual(m.match, null);
                });
            });
        }

        if (test.matchResult) {
            Object.keys(test.matchResult).forEach(input => {
                const matchResult = test.matchResult[input];

                it(`match result for "${input}"`, () => {
                    const m = matchAsTree(prepareTokens(input), matchTree, syntaxes);

                    assert.deepStrictEqual(processMatchResult(m.match.match), matchResult);
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
