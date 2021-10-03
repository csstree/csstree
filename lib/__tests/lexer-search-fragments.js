import assert from 'assert';
import { parse, generate, lexer } from 'css-tree';

function translateFragments(fragments) {
    return fragments.map(fragment => generate({
        type: 'Value',
        loc: null,
        children: fragment.nodes
    }));
}

describe('lexer search fragments', () => {
    describe('findValueFragments()', () => {
        it('should find single entry', () => {
            const declaration = parse('border: 1px solid red', { context: 'declaration' });
            const result = lexer.findValueFragments(declaration.property, declaration.value, 'Type', 'color');

            assert.deepStrictEqual(translateFragments(result), ['red']);
        });

        it('should find multiple entries', () => {
            const declaration = parse('font: 10px Arial, Courier new, Times new roman', { context: 'declaration' });
            const result = lexer.findValueFragments(declaration.property, declaration.value, 'Type', 'family-name');

            assert.deepStrictEqual(translateFragments(result), ['Arial', 'Courier new', 'Times new roman']);
        });
    });

    describe('findDeclarationValueFragments()', () => {
        it('should find single entry', () => {
            const declaration = parse('border: 1px solid red', { context: 'declaration' });
            const result = lexer.findDeclarationValueFragments(declaration, 'Type', 'color');

            assert.deepStrictEqual(translateFragments(result), ['red']);
        });

        it('should find multiple entries', () => {
            const declaration = parse('font: 10px Arial, Courier new, Times new roman', { context: 'declaration' });
            const result = lexer.findDeclarationValueFragments(declaration, 'Type', 'family-name');

            assert.deepStrictEqual(translateFragments(result), ['Arial', 'Courier new', 'Times new roman']);
        });
    });

    describe('findAllFragments()', () => {
        it('should find all entries in ast', () => {
            const ast = parse('foo { border: 1px solid red; } bar { color: rgba(1,2,3,4); border-color: #123 rgb(1,2,3) }');
            const result = lexer.findAllFragments(ast, 'Type', 'color');

            assert.deepStrictEqual(translateFragments(result), ['red', 'rgba(1,2,3,4)', '#123', 'rgb(1,2,3)']);
        });
    });
});
