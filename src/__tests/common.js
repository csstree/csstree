import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { parse, walk, fork, version, tokenTypes, generate } from 'css-tree';

const fixtureFilename = './fixtures/stringify.css';
const fixture = normalize(fs.readFileSync(fixtureFilename, 'utf-8'));;
const types = Object.keys(parse.config.node).sort()
    .filter(type => type !== 'DeclarationList'); // DeclarationList doesn't appear in StyleSheet

function normalize(str) {
    return str.replace(/\n|\r\n?|\f/g, '\n');
}

describe('Common', () => {
    it('should expose version', () => {
        assert.strictEqual(version, JSON.parse(fs.readFileSync('./package.json')).version);
    });

    it('JSON.stringify()', () => {
        const ast = parse(fixture, {
            filename: path.basename(fixtureFilename),
            positions: true
        });

        // fs.writeFileSync(fixtureFilename.replace(/\.css/, '.ast'), JSON.stringify(ast, null, 4) + '\n', 'utf-8');

        assert.strictEqual(
            JSON.stringify(ast, null, 4),
            normalize(fs.readFileSync('./fixtures/stringify.ast', 'utf-8').trim())
        );
    });

    it('test CSS should contain all node types', () => {
        const foundTypes = new Set();
        const ast = parse(fixture);

        walk(ast, node => foundTypes.add(node.type));

        assert.deepStrictEqual(
            [...foundTypes].sort(),
            types.sort().filter(type => type !== 'WhiteSpace') // FIXME: temporary filter white space
        );
    });

    describe('extension in base classes should not cause to exception', () => {
        beforeEach(() => {
            Object.prototype.objectExtraField = () => {};
            Array.prototype.arrayExtraField = () => {};
        });
        afterEach(() => {
            delete Object.prototype.objectExtraField;
            delete Array.prototype.arrayExtraField;
        });

        it('fork()', () => {
            assert.doesNotThrow(() => {
                fork({
                    node: {
                        Test: {
                            structure: {
                                foo: 'Rule',
                                bar: [['Rule']]
                            }
                        }
                    }
                });
            });
        });
    });

    it('generic option should work in fork()', () => {
        const forkWithoutGeneric = fork({
            // By default, generic is true, but we disable it
            generic: false
        });

        const forkWithGeneric = fork({
            // By default, generic is true
        });

        // Generic should be set
        assert.strictEqual(forkWithoutGeneric.lexer.generic, false);
        assert.strictEqual(forkWithGeneric.lexer.generic, true);

        // Lexer match should depend on generic (<length> is generic type)
        const node = parse('1px', { context: 'value' });

        assert.throws(() => forkWithoutGeneric.lexer.match('<length>', node));
        assert.doesNotThrow(() => forkWithGeneric.lexer.match('<length>', node));
    });

    describe('fork()', () => {
        it('extend nodes', () => {
            const ast = parse('20px', { context: 'value' });
            const forkedSyntax = fork({
                node: {
                    Dimension: {
                        generate(node) {
                            this.token(tokenTypes.Dimension, '?' + node.unit);
                        }
                    }
                }
            });

            // Generic should be set
            assert.strictEqual(forkedSyntax.generate(ast), '?px');
            assert.strictEqual(generate(ast), '20px');
        });
    });
});
