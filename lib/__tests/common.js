import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { parse, walk, fork, lexer, generate, version, tokenTypes } from 'css-tree';

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

    it('JSON.strigify()', () => {
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

    describe('custom tokenizer should work via fork()', () => {
        it('custom tokenizer should be set', () => {
            const customTokenizer = () => {};

            const forkedCssTree = fork({
                tokenize: customTokenizer
            });

            assert.strictEqual(forkedCssTree.tokenize, customTokenizer);
        });

        it('custom tokenizer should affect the parser', () => {
            const customTokenizer = (source, onToken) => {
                onToken(tokenTypes.Ident, 0, source.length);
            };

            const forkedCssTree = fork({
                tokenize: customTokenizer
            });

            const parserOptions = { context: 'value' };
            const input = 'foo(bar)';

            const defaultAst = parse(input, parserOptions);
            const forkAst = forkedCssTree.parse(input, parserOptions);

            // Default parser should give an AST with a function node whose first child is an identifier
            assert.strictEqual(forkAst.children.size, 1);
            assert.strictEqual(defaultAst.children.first.type, 'Function');
            assert.strictEqual(defaultAst.children.first.children.size, 1);
            assert.strictEqual(defaultAst.children.first.children.first.type, 'Identifier');

            // Forked parser should give an AST with an identifier node
            assert.strictEqual(forkAst.children.size, 1);
            assert.strictEqual(forkAst.children.first.type, 'Identifier');
        });

        it('custom tokenizer should affect the lexer', () => {
            const customTokenizer = (source, onToken) => {
                onToken(tokenTypes.Ident, 0, source.length);
            };

            const forkedCssTree = fork({
                tokenize: customTokenizer
            });

            const syntax = 'foo( <number> )';
            const input = 'foo(1)';

            // Default lexer should match the function syntax
            assert(lexer.match(syntax, input).matched);

            // Forked lexer should not match the function syntax, because the input isn't tokenized as a function
            const forkedResult = forkedCssTree.lexer.match(syntax, input);
            assert.strictEqual(forkedResult.matched, null);
        });

        it('custom tokenizer should affect the generator', () => {
            // This custom tokenizer only generates a single token
            const customTokenizer = (_, onToken) => {
                onToken(tokenTypes.Ident, 0, 1);
            };

            const forkedCssTree = fork({
                tokenize: customTokenizer,
                node: {
                    Identifier: {
                        structure: {
                            name: String
                        },
                        generate(node) {
                            // This should be the custom tokenizer
                            this.tokenize(node.name);
                        }
                    }
                }
            });

            const parserOptions = { context: 'value' };
            const input = 'foo';
            const ast = parse(input, parserOptions);

            // Default generator should generate the whole input as-is
            assert.equal(generate(ast), input);

            // Custom tokenizer only generates a single token for the first character,
            // so if the generator uses the custom tokenizer, it should only generate the first character
            assert.equal(forkedCssTree.generate(ast), input[0]);
        });
    });
});
