import assert, { strictEqual } from 'assert';
import { parse, generate, toPlainObject } from 'css-tree';
import { forEachTest as forEachAstTest } from './fixture/ast.js';
import { fixture as generateAutoWsFixture } from './fixture/generate-auto-emit-ws.js';

function createGenerateTests(name, test) {
    (test.skip ? it.skip : it)(name, () => {
        const ast = parse(test.source, test.options);
        const actual = generate(ast);
        const expected = 'generate' in test ? test.generate : test.source;

        // strings should be equal
        assert.strictEqual(actual, expected);
    });

    (test.skip ? it.skip : it)(name + ' (plain object)', () => {
        const ast = parse(test.source, test.options);
        const actual = generate(toPlainObject(ast));
        const expected = 'generate' in test ? test.generate : test.source;

        // strings should be equal
        assert.strictEqual(actual, expected);
    });

    // FIXME: Skip some test cases for round-trip check until generator's improvements
    const skipRoundTrip = test.skip || /block at-rule #c\.2|atruler\.c\.2|parentheses\.c\.3/.test(name);
    (skipRoundTrip ? it.skip : it)(name + ' (round-trip)', () => {
        const expected = parse(test.source, test.options);
        const actual = parse(generate(expected), test.options);

        // https://drafts.csswg.org/css-syntax/#serialization
        // The only requirement for serialization is that it must "round-trip" with parsing,
        // that is, parsing the stylesheet must produce the same data structures as parsing,
        // serializing, and parsing again, except for consecutive <whitespace-token>s,
        // which may be collapsed into a single token.
        assert.deepStrictEqual(actual, expected);
    });
}

function createGenerateWithSourceMapTest(name, test) {
    (test.skip ? it.skip : it)(name, () => {
        const ast = parse(test.source, {
            ...test.options,
            positions: true
        });

        // strings should be equal
        assert.strictEqual(
            generate(ast, { sourceMap: true }).css,
            'generate' in test ? test.generate : test.source
        );
    });
}

describe('generate', () => {
    forEachAstTest(createGenerateTests);

    it('should throws on unknown node type', () =>
        assert.throws(
            () => generate({ type: 'xxx' }),
            /Unknown node type/
        )
    );

    describe('sourceMap', () => {
        forEachAstTest(createGenerateWithSourceMapTest);

        it('should generate a map', () => {
            const ast = parse('.a {\n  color: red;\n}\n', {
                filename: 'test.css',
                positions: true
            });
            const result = generate(ast, { sourceMap: true });

            assert.strictEqual(result.css, '.a{color:red}');
            assert.strictEqual(result.map.toString(), '{"version":3,"sources":["test.css"],"names":[],"mappings":"AAAA,E,CACE,S"}');
        });

        it('complex CSS', () => {
            const ast = parse('.a { color: #ff0000; } .b { display: block; float: left; } @media foo { .c { color: red } }', {
                filename: 'test.css',
                positions: true
            });
            const result = generate(ast, { sourceMap: true });

            assert.strictEqual(result.css, '.a{color:#ff0000}.b{display:block;float:left}@media foo{.c{color:red}}');
            assert.strictEqual(result.map.toString(), '{"version":3,"sources":["test.css"],"names":[],"mappings":"AAAA,E,CAAK,a,CAAkB,E,CAAK,a,CAAgB,U,CAAe,WAAa,E,CAAK,W"}');
        });
    });

    describe('spec mode', () => {
        for (const fixture of generateAutoWsFixture) {
            const {
                id,
                ws,
                left: { value: leftValue },
                right: { value: rightValue }
            } = fixture;
            const expectedNoWs = `${leftValue}${rightValue}`;
            const expectedWs = `${leftValue} ${rightValue}`;

            it(id, () => {
                const actual = generate({
                    type: 'Value',
                    children: [
                        { type: 'Raw', value: leftValue },
                        { type: 'Raw', value: rightValue }
                    ]
                }, { mode: 'spec' });

                if (ws) {
                    strictEqual(actual, expectedWs);
                } else {
                    if (actual !== expectedNoWs) {
                        strictEqual(actual, expectedWs);
                    }
                }
            });
        }
    });
});
