const assert = require('assert');
const { parse, lexer } = require('./helpers/lib');

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
        assert.deepEqual(match.getTrace(testNode), [
            { type: 'Property', name: 'background' },
            { type: 'Type', opts: null, name: 'final-bg-layer' },
            { type: 'Property', name: 'background-color' },
            { type: 'Type', opts: null, name: 'color' },
            { type: 'Type', opts: null, name: 'rgb()' },
            { type: 'Type', opts: null, name: 'number' }
        ]);
        assert.equal(mismatch.getTrace(testNode), null);
    });

    it('isType()', () => {
        assert.equal(match.isType(testNode, 'color'), true);
        assert.equal(match.isType(testNode, 'final-bg-layer'), true);
        assert.equal(match.isType(testNode, 'background-color'), false);
        assert.equal(match.isType(testNode, 'foo'), false);

        assert.equal(mismatch.isType(testNode, 'color'), false);
    });

    it('isProperty()', () => {
        assert.equal(match.isProperty(testNode, 'color'), false);
        assert.equal(match.isProperty(testNode, 'final-bg-layer'), false);
        assert.equal(match.isProperty(testNode, 'background-color'), true);
        assert.equal(match.isProperty(testNode, 'foo'), false);

        assert.equal(mismatch.isProperty(testNode, 'color'), false);
    });

    it('isKeyword()', () => {
        const ast = parse('repeat 0', { context: 'value' });
        const keywordNode = ast.children.first;
        const numberNode = ast.children.last;
        const match = lexer.matchProperty('background', ast);

        assert.equal(match.isKeyword(keywordNode), true);
        assert.equal(match.isKeyword(numberNode), false);
    });
});
