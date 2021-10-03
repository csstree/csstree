import assert from 'assert';
import { definitionSyntax } from 'css-tree';

const { parse, generate, walk } = definitionSyntax;

describe('definitionSyntax.walk()', () => {
    it('pass a single walk function', () => {
        const ast = parse('a b | c() && [ <d>? || <\'e\'> || ( f{2,4} ) ]*');
        const visited = [];

        walk(ast, node => visited.push({
            type: node.type,
            value: generate(node)
        }));

        assert.deepStrictEqual(visited, [
            { type: 'Group',       value: 'a b | c( ) && [ <d>? || <\'e\'> || ( f{2,4} ) ]*' },
            { type: 'Group',       value: 'a b' },        // implicit group: a b -> [ a b ]
            { type: 'Keyword',     value: 'a' },
            { type: 'Keyword',     value: 'b' },
            { type: 'Group',       value: 'c( ) && [ <d>? || <\'e\'> || ( f{2,4} ) ]*' },
            { type: 'Group',       value: 'c( )' },
            { type: 'Function',    value: 'c(' },
            { type: 'Token',       value: ')' },
            { type: 'Multiplier',  value: '[ <d>? || <\'e\'> || ( f{2,4} ) ]*' },
            { type: 'Group',       value: '[ <d>? || <\'e\'> || ( f{2,4} ) ]' },
            { type: 'Multiplier',  value: '<d>?' },
            { type: 'Type',        value: '<d>' },
            { type: 'Property',    value: '<\'e\'>' },
            { type: 'Group',       value: '( f{2,4} )' },
            { type: 'Token',       value: '(' },
            { type: 'Multiplier',  value: 'f{2,4}' },
            { type: 'Keyword',     value: 'f' },
            { type: 'Token',       value: ')' }
        ]);
    });

    it('pass a pair of walk functions', () => {
        const ast = parse('a b? | c() && [ <d> ]+');
        const visited = [];

        walk(ast, {
            enter: node => visited.push({
                action: 'enter',
                value: generate(node)
            }),
            leave: node => visited.push({
                action: 'leave',
                value: generate(node)
            })
        });

        assert.deepStrictEqual(visited, [
            { action: 'enter', value: 'a b? | c( ) && [ <d> ]+' },
            { action: 'enter', value: 'a b?' },
            { action: 'enter', value: 'a' },
            { action: 'leave', value: 'a' },
            { action: 'enter', value: 'b?' },
            { action: 'enter', value: 'b' },
            { action: 'leave', value: 'b' },
            { action: 'leave', value: 'b?' },
            { action: 'leave', value: 'a b?' },
            { action: 'enter', value: 'c( ) && [ <d> ]+' },
            { action: 'enter', value: 'c( )' },
            { action: 'enter', value: 'c(' },
            { action: 'leave', value: 'c(' },
            { action: 'enter', value: ')' },
            { action: 'leave', value: ')' },
            { action: 'leave', value: 'c( )' },
            { action: 'enter', value: '[ <d> ]+' },
            { action: 'enter', value: '[ <d> ]' },
            { action: 'enter', value: '<d>' },
            { action: 'leave', value: '<d>' },
            { action: 'leave', value: '[ <d> ]' },
            { action: 'leave', value: '[ <d> ]+' },
            { action: 'leave', value: 'c( ) && [ <d> ]+' },
            { action: 'leave', value: 'a b? | c( ) && [ <d> ]+' }
        ]);
    });

    it('should throw an exception when nothing passed as walker handler', () =>
        assert.throws(
            () => walk(parse('a | b')),
            /Neither `enter` nor `leave` walker handler is set or both aren\'t a function/
        )
    );

    it('should throw an exception when passed object has no enter or leave methods', () =>
        assert.throws(
            () => walk(parse('a | b'), {}),
            /Neither `enter` nor `leave` walker handler is set or both aren\'t a function/
        )
    );
});
