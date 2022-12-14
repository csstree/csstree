import fs from 'fs';
import assert from 'assert';
import * as csstree from 'css-tree';
import * as tokenizer from 'css-tree/tokenizer';
import parse from 'css-tree/parser';
import parseSelector from 'css-tree/selector-parser';
import walk from 'css-tree/walker';
import generate from 'css-tree/generator';
import convertor from 'css-tree/convertor';
import * as lexer from 'css-tree/lexer';
import * as definitionSyntax from 'css-tree/definition-syntax';
import data from 'css-tree/definition-syntax-data';
import dataPatch from 'css-tree/definition-syntax-data-patch';
import * as utils from 'css-tree/utils';

const stringifyWithNoInfo = ast => JSON.stringify(ast, (key, value) => key !== 'loc' ? value : undefined, 4);
const fixtureFilename = './fixtures/stringify.css';
const css = fs.readFileSync(fixtureFilename, 'utf-8');
const expectedAst = JSON.parse(fs.readFileSync(fixtureFilename.replace('.css', '.ast'), 'utf8'));

describe('exports / entry points', () => {
    it('tokenizer', () => {
        assert.deepStrictEqual(Object.keys(tokenizer).sort(), [
            'AtKeyword',
            'BadString',
            'BadUrl',
            'CDC',
            'CDO',
            'Colon',
            'Comma',
            'Comment',
            'Delim',
            'DigitCategory',
            'Dimension',
            'EOF',
            'EofCategory',
            'Function',
            'Hash',
            'Ident',
            'LeftCurlyBracket',
            'LeftParenthesis',
            'LeftSquareBracket',
            'NameStartCategory',
            'NonPrintableCategory',
            'Number',
            'OffsetToLocation',
            'Percentage',
            'RightCurlyBracket',
            'RightParenthesis',
            'RightSquareBracket',
            'Semicolon',
            'String',
            'TokenStream',
            'Url',
            'WhiteSpace',
            'WhiteSpaceCategory',
            'charCodeCategory',
            'cmpChar',
            'cmpStr',
            'consumeBadUrlRemnants',
            'consumeEscaped',
            'consumeName',
            'consumeNumber',
            'decodeEscaped',
            'findDecimalNumberEnd',
            'findWhiteSpaceEnd',
            'findWhiteSpaceStart',
            'getNewlineLength',
            'isBOM',
            'isDigit',
            'isHexDigit',
            'isIdentifierStart',
            'isLetter',
            'isLowercaseLetter',
            'isName',
            'isNameStart',
            'isNewline',
            'isNonAscii',
            'isNonPrintable',
            'isNumberStart',
            'isUppercaseLetter',
            'isValidEscape',
            'isWhiteSpace',
            'tokenNames',
            'tokenTypes',
            'tokenize'
        ]);
    });

    it('parser', () => {
        const ast = parse(css);
        assert.strictEqual(stringifyWithNoInfo(ast), stringifyWithNoInfo(expectedAst));
    });

    describe('selector-parser', () => {
        const selectors = [];

        // collect all the selectors
        csstree.walk(expectedAst, function(node) {
            if (node.type === 'SelectorList' || node.type === 'Selector') {
                selectors.push({ css: csstree.generate(node), expected: node });

                return csstree.walk.skip;
            }
        });

        for (const test of selectors) {
            it(test.css, () => {
                const ast = parseSelector(test.css);
                assert.strictEqual(stringifyWithNoInfo(ast), stringifyWithNoInfo(test.expected));
            });
        }
    });

    it('generator', () => {
        assert.strictEqual(generate(expectedAst), csstree.generate(expectedAst));
    });

    it('walker', () => {
        const actualTypes = [];
        const expectedTypes = [];

        walk(expectedAst, node => actualTypes.push(node.type));
        csstree.walk(expectedAst, node => expectedTypes.push(node.type));

        assert.deepStrictEqual(actualTypes, expectedTypes);
    });

    it('convertor', () => {
        const ast = parse(css);
        const findFirstAtrule = ast => csstree.walk.find(ast, node => node.type === 'Atrule');

        assert.strictEqual(ast.children instanceof utils.List, true);
        assert.strictEqual(findFirstAtrule(ast).prelude.children instanceof utils.List, true);

        convertor.toPlainObject(ast);

        assert.strictEqual(Array.isArray(ast.children), true);
        assert.strictEqual(Array.isArray(findFirstAtrule(ast).prelude.children), true);

        convertor.fromPlainObject(ast);

        assert.strictEqual(ast.children instanceof utils.List, true);
        assert.strictEqual(findFirstAtrule(ast).prelude.children instanceof utils.List, true);

        assert.deepStrictEqual(Object.keys(convertor).sort(), [
            'fromPlainObject',
            'toPlainObject'
        ]);
    });

    it('lexer', () => {
        assert(typeof lexer.Lexer === 'function');
        assert.deepStrictEqual(Object.keys(lexer).sort(), [
            'Lexer'
        ]);
    });

    it('definitionSyntax', () => {
        assert.deepStrictEqual(Object.keys(definitionSyntax).sort(), [
            'SyntaxError',
            'generate',
            'parse',
            'walk'
        ]);
    });

    it('data', () => {
        assert.deepStrictEqual(Object.keys(data).sort(), [
            'atrules',
            'properties',
            'types'
        ]);
    });

    it('data-patch', () => {
        assert.deepStrictEqual(Object.keys(dataPatch).sort(), [
            'atrules',
            'properties',
            'types'
        ]);
    });

    it('utils', () => {
        assert.deepStrictEqual(Object.keys(utils).sort(), [
            'List',
            'clone',
            'ident',
            'isCustomProperty',
            'keyword',
            'property',
            'string',
            'url',
            'vendorPrefix'
        ]);
        assert.strictEqual(utils.string.encode('foo'), '"foo"');
        assert.strictEqual(utils.keyword('-webkit-foo').basename, 'foo');
    });
});
