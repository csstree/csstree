import assert from 'assert';
import { parse, generate, tokenize, tokenTypes, url } from 'css-tree';

describe('escaped url names', () => {
    const names = ['\\75 Rl', 'u\\72l', 'ur\\6c', '\\u\\r\\l', '\\000075\\000052\\00006c', '\\75\r\nr\\6C'];

    function tokens(source) {
        const result = [];
        tokenize(source, (type, start, end) => result.push({
            type,
            value: source.slice(start, end)
        }));
        return result;
    }

    for (const name of names) {
        it('tokenizes an unquoted URL named ' + JSON.stringify(name), () => {
            const source = name + '(foo\\ bar.png)';
            assert.deepStrictEqual(tokens(source), [{ type: tokenTypes.Url, value: source }]);
        });

        it('preserves the quoted function boundary for ' + JSON.stringify(name), () => {
            const source = name + '( "foo" )';
            assert.deepStrictEqual(tokens(source), [
                { type: tokenTypes.Function, value: name + '(' },
                { type: tokenTypes.WhiteSpace, value: ' ' },
                { type: tokenTypes.String, value: '"foo"' },
                { type: tokenTypes.WhiteSpace, value: ' ' },
                { type: tokenTypes.RightParenthesis, value: ')' }
            ]);
        });

        it('decodes the URL value after ' + JSON.stringify(name), () => {
            assert.strictEqual(url.decode(name + '(foo\\ bar.png)'), 'foo bar.png');
        });

        for (const suffix of ['(foo)', '( "foo" )', "( 'foo' )"]) {
            it('parses ' + JSON.stringify(name + suffix) + ' as a URL', () => {
                const ast = parse(name + suffix, { context: 'value' });
                assert.strictEqual(ast.children.first.type, 'Url');
                assert.strictEqual(ast.children.first.value, 'foo');
                assert.strictEqual(generate(ast), 'url(foo)');
            });
        }
    }

    for (const name of ['curl', 'urls', 'urlx', '\\75rlx', 'u\\0072lx', '\\000075xrl']) {
        it('keeps the distinct function name ' + JSON.stringify(name), () => {
            assert.strictEqual(tokens(name + '(foo)')[0].type, tokenTypes.Function);
            assert.strictEqual(parse(name + '(foo)', { context: 'value' }).children.first.type, 'Function');
        });
    }

    it('keeps bad URL handling for an escaped name', () => {
        const source = '\\75rl(a b)';
        assert.deepStrictEqual(tokens(source), [{ type: tokenTypes.BadUrl, value: source }]);
    });
});
