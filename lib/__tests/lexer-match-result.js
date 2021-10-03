import assert from 'assert';
import { parse, lexer } from 'css-tree';

describe('lexer match result', () => {
    let testNode;
    let match;
    let mismatch;

    beforeEach(() => {
        const ast = parse('rgb(1, 2, 3)', { context: 'value' });
        testNode = ast.children.first.children.first;
        match = lexer.matchProperty('background', ast);
        mismatch = lexer.matchProperty('margin', ast);
    });

    it('getTrace()', () => {
        assert.deepStrictEqual(match.getTrace(testNode), [
            { type: 'Property', name: 'background' },
            { type: 'Type', opts: null, name: 'final-bg-layer' },
            { type: 'Property', name: 'background-color' },
            { type: 'Type', opts: null, name: 'color' },
            { type: 'Type', opts: null, name: 'rgb()' },
            { type: 'Type', opts: null, name: 'number' }
        ]);
        assert.strictEqual(mismatch.getTrace(testNode), null);
    });

    it('isType()', () => {
        assert.strictEqual(match.isType(testNode, 'color'), true);
        assert.strictEqual(match.isType(testNode, 'final-bg-layer'), true);
        assert.strictEqual(match.isType(testNode, 'background-color'), false);
        assert.strictEqual(match.isType(testNode, 'foo'), false);

        assert.strictEqual(mismatch.isType(testNode, 'color'), false);
    });

    it('isProperty()', () => {
        assert.strictEqual(match.isProperty(testNode, 'color'), false);
        assert.strictEqual(match.isProperty(testNode, 'final-bg-layer'), false);
        assert.strictEqual(match.isProperty(testNode, 'background-color'), true);
        assert.strictEqual(match.isProperty(testNode, 'foo'), false);

        assert.strictEqual(mismatch.isProperty(testNode, 'color'), false);
    });

    it('isKeyword()', () => {
        const ast = parse('repeat 0', { context: 'value' });
        const keywordNode = ast.children.first;
        const numberNode = ast.children.last;
        const match = lexer.matchProperty('background', ast);

        assert.strictEqual(match.isKeyword(keywordNode), true);
        assert.strictEqual(match.isKeyword(numberNode), false);
    });
});
