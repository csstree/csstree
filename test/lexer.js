var assert = require('assert');
var parseCss = require('../lib').parse;
var syntax = require('../lib');
var fixture = require('./fixture/syntax');

function getMatch(lexer, property, value, syntax) {
    return syntax
        ? lexer.match(syntax, value)
        : lexer.matchProperty(property, value);
}

function createMatchTest(testType, testState, name, lexer, property, value, syntax) {
    switch (testType) {
        case 'valid':
            (it[testState] || it)(name, function() {
                var match = getMatch(lexer, property, value, syntax);

                // temporary solution to avoid var() using errors
                if (match.error) {
                    if (
                        /Matching for a tree with var\(\) is not supported/.test(match.error.message) ||
                        /Lexer matching doesn't applicable for custom properties/.test(match.error.message)) {
                        assert(true);
                        return;
                    }
                }

                assert(match.matched !== null, match.error && match.error.message);
            });
            break;

        case 'invalid':
            (it[testState] || it)(name, function() {
                var match = getMatch(lexer, property, value, syntax);

                assert.equal(match.matched, null, 'should NOT MATCH to "' + value + '"');
                assert.equal(match.error.name, 'SyntaxMatchError');
            });
            break;
    }
}

function createAtrulePreludeMatchTest(testType, testState, name, lexer, atruleName, value) {
    switch (testType) {
        case 'valid':
            (it[testState] || it)(name, function() {
                var match = lexer.matchAtrulePrelude(atruleName, value);

                assert(match.matched !== null, match.error && match.error.message);
            });
            break;

        case 'invalid':
            (it[testState] || it)(name, function() {
                var match = lexer.matchAtrulePrelude(atruleName, value);

                assert.equal(match.matched, null, 'should NOT MATCH to "' + value + '"');
                assert.equal(match.error.name, 'SyntaxMatchError');
            });
            break;
    }
}

function createAtruleDescriptorMatchTest(testType, testState, name, lexer, atruleName, descriptorName, value) {
    switch (testType) {
        case 'valid':
            (it[testState] || it)(name, function() {
                var match = lexer.matchAtruleDescriptor(atruleName, descriptorName, value);

                assert(match.matched !== null, match.error && match.error.message);
            });
            break;

        case 'invalid':
            (it[testState] || it)(name, function() {
                var match = lexer.matchAtruleDescriptor(atruleName, descriptorName, value);

                assert.equal(match.matched, null, 'should NOT MATCH to "' + value + '"');
                assert.equal(match.error.name, 'SyntaxMatchError');
            });
            break;
    }
}

describe('lexer', function() {
    it('should not override generic types when used', function() {
        var customLexer = syntax.createLexer({
            generic: true,
            types: {
                length: 'foo'
            }
        });

        assert.equal(customLexer.matchType('length', 'foo').matched, null);
        assert.notEqual(customLexer.matchType('length', '1px').matched, null);
    });

    it('should not use generic type names when generics are not used', function() {
        var customLexer = syntax.createLexer({
            types: {
                length: 'foo'
            }
        });

        assert.notEqual(customLexer.matchType('length', 'foo').matched, null);
        assert.equal(customLexer.matchType('length', '1px').matched, null);
    });

    it('validate()', function() {
        var customLexer = syntax.createLexer({
            generic: true,
            types: {
                ref: '<string>',
                valid: '<number> <ref>',
                invalid: '<foo>'
            },
            properties: {
                ref: '<valid>',
                valid: '<ident> <\'ref\'>',
                invalid: '<invalid>'
            }
        });

        assert.deepEqual(customLexer.validate(), {
            types: [
                'invalid'
            ],
            properties: [
                'invalid'
            ]
        });
    });

    it('default syntax shouldn\'t to be broken', function() {
        assert.equal(syntax.lexer.validate(), null);
    });

    describe('dump & recovery', function() {
        var customLexer = syntax.createLexer({
            generic: true,
            types: {
                foo: '<number>'
            },
            properties: {
                test: '<foo>+'
            }
        });

        it('custom syntax should not affect base syntax', function() {
            assert.equal(syntax.lexer.validate(), null);
            assert(syntax.lexer.matchProperty('test', parseCss('1 2 3', { context: 'value' })).matched === null);
            assert(syntax.lexer.matchProperty('color', parseCss('red', { context: 'value' })).matched !== null);
        });

        it('custom syntax should be valid and correct', function() {
            assert.equal(customLexer.validate(), null);
        });

        it('custom syntax should match own grammar only', function() {
            assert(customLexer.matchProperty('test', parseCss('1 2 3', { context: 'value' })).matched !== null);
            assert(customLexer.matchProperty('color', parseCss('red', { context: 'value' })).matched === null);
        });

        it('recovery syntax from dump', function() {
            var recoverySyntax = syntax.fork(function(prev, assign) {
                return assign(prev, customLexer.dump());
            });

            assert.equal(recoverySyntax.lexer.validate(), null);
            assert(recoverySyntax.lexer.matchProperty('test', parseCss('1 2 3', { context: 'value' })).matched !== null);
        });
    });

    describe('structure', function() {
        it('should fail when no structure field in node definition', function() {
            assert.throws(function() {
                syntax.fork(function(prev) {
                    prev.node.Test = {};
                    return prev;
                });
            }, /Missed `structure` field in `Test` node type definition/);
        });

        it('should fail on bad value in structure', function() {
            assert.throws(function() {
                syntax.fork(function(prev) {
                    prev.node.Test = {
                        structure: {
                            foo: [123]
                        }
                    };
                    return prev;
                });
            }, /Wrong value `123` in `Test\.foo` structure definition/);
        });
    });

    describe('checkStructure()', function() {
        it('should pass correct structure', function() {
            var ast = parseCss('.foo { color: red }', { positions: true });
            var warns = syntax.lexer.checkStructure(ast);

            assert.equal(warns, false);
        });

        it('should ignore properties from prototype', function() {
            var node = {
                type: 'Number',
                loc: null,
                value: '123'
            };

            Object.prototype.foo = 123;
            try {
                assert.equal(syntax.lexer.checkStructure(node), false);
            } finally {
                delete Object.prototype.foo;
            }
        });

        describe('errors', function() {
            it('node should be an object', function() {
                var node = [];
                node.type = 'Number';

                assert.deepEqual(syntax.lexer.checkStructure(node), [
                    { node: node, message: 'Type of node should be an Object' }
                ]);
            });

            it('missed fields', function() {
                var node = {
                    type: 'Foo'
                };

                assert.deepEqual(syntax.lexer.checkStructure(node), [
                    { node: node, message: 'Unknown node type `Foo`' }
                ]);
            });

            it('missed field', function() {
                var node = {
                    type: 'Dimension',
                    value: '123'
                };

                assert.deepEqual(syntax.lexer.checkStructure(node), [
                    { node: node, message: 'Field `Dimension.loc` is missed' },
                    { node: node, message: 'Field `Dimension.unit` is missed' }
                ]);
            });

            it('unknown field', function() {
                var node = {
                    type: 'Number',
                    loc: null,
                    value: '123',
                    foo: 1
                };

                assert.deepEqual(syntax.lexer.checkStructure(node), [
                    { node: node, message: 'Unknown field `foo` for Number node type' }
                ]);
            });

            describe('bad value', function() {
                it('bad data type', function() {
                    var node = {
                        type: 'Number',
                        loc: null,
                        value: 123
                    };

                    assert.deepEqual(syntax.lexer.checkStructure(node), [
                        { node: node, message: 'Bad value for `Number.value`' }
                    ]);
                });

                it('bad loc', function() {
                    var node = {
                        type: 'Number',
                        loc: {},
                        value: '123'
                    };

                    assert.deepEqual(syntax.lexer.checkStructure(node), [
                        { node: node, message: 'Bad value for `Number.loc.source`' }
                    ]);
                });

                it('bad loc #2', function() {
                    var node = {
                        type: 'Number',
                        loc: {
                            source: '-',
                            start: { line: 1, column: 1 },
                            end: { line: 1, column: 1, offset: 0 }
                        },
                        value: '123'
                    };

                    assert.deepEqual(syntax.lexer.checkStructure(node), [
                        { node: node, message: 'Bad value for `Number.loc.start`' }
                    ]);
                });

                it('bad loc #3', function() {
                    var node = {
                        type: 'Number',
                        loc: {
                            source: '-',
                            start: { line: 1, column: 1, offset: 0 },
                            end: { line: 1, column: 1 }
                        },
                        value: '123'
                    };

                    assert.deepEqual(syntax.lexer.checkStructure(node), [
                        { node: node, message: 'Bad value for `Number.loc.end`' }
                    ]);
                });
            });
        });
    });

    describe('matchAtrulePrelude()', function() {
        var animationName = parseCss('animation-name', { context: 'atrulePrelude', atrule: 'keyframes' });
        var number = parseCss('123', { context: 'atrulePrelude', atrule: 'unknown' });
        var customSyntax = syntax.fork({
            atrules: {
                '-foo-keyframes': {
                    prelude: '<number>'
                }
            }
        });

        it('should match', function() {
            var match = customSyntax.lexer.matchAtrulePrelude('keyframes', animationName);

            assert(match.matched);
            assert.equal(match.error, null);
        });

        describe('vendor prefixes', function() {
            it('vendor prefix', function() {
                var match = customSyntax.lexer.matchAtrulePrelude('-webkit-keyframes', animationName);

                assert(match.matched);
                assert.equal(match.error, null);
            });

            it('case insensetive with vendor prefix', function() {
                var match;

                match = customSyntax.lexer.matchAtrulePrelude('KEYFRAMES', animationName);
                assert(match.matched);
                assert.equal(match.error, null);

                match = customSyntax.lexer.matchAtrulePrelude('-VENDOR-Keyframes', animationName);
                assert(match.matched);
                assert.equal(match.error, null);
            });

            it('should use verdor version first', function() {
                var match;

                match = customSyntax.lexer.matchAtrulePrelude('-foo-keyframes', number);
                assert(match.matched);
                assert.equal(match.error, null);

                match = customSyntax.lexer.matchAtrulePrelude('keyframes', number);
                assert.equal(match.matched, null);
                assert.equal(match.error.message, 'Mismatch\n  syntax: <keyframes-name>\n   value: 123\n  --------^');
            });
        });

        it('should not be matched to empty value', function() {
            var match = syntax.lexer.matchAtrulePrelude('keyframes', parseCss('', { context: 'atrulePrelude', positions: true }));

            assert.equal(match.matched, null);
            assert.equal(match.error.rawMessage, 'Mismatch');
            assert.deepEqual({
                line: match.error.line,
                column: match.error.column
            }, {
                line: 1,
                column: 1
            });
        });

        it('should not be matched to at-rules with no prelude', function() {
            var match = syntax.lexer.matchAtrulePrelude('font-face', animationName);

            assert.equal(match.matched, null);
            assert.equal(match.error.message, 'At-rule `font-face` should not contain a prelude');

            var match = syntax.lexer.matchAtrulePrelude('-prefix-font-face', animationName);

            assert.equal(match.matched, null);
            assert.equal(match.error.message, 'At-rule `-prefix-font-face` should not contain a prelude');
        });

        fixture.forEachAtrulePreludeTest(createAtrulePreludeMatchTest);
    });

    describe('matchAtruleDescriptor()', function() {
        var swapValue = parseCss('swap', { context: 'value' });
        var xxxValue = parseCss('xxx', { context: 'value' });
        var customSyntax = syntax.fork((prev) => Object.assign({}, prev, {
            atrules: {
                'font-face': {
                    descriptors: {
                        ...prev.atrules['font-face'].descriptors,
                        '-foo-font-display': 'auto | block | swap | fallback | optional | xxx'
                    }
                }
            }
        }));

        it('should match', function() {
            var match = customSyntax.lexer.matchAtruleDescriptor('font-face', 'font-display', swapValue);

            assert(match.matched);
            assert.equal(match.error, null);
        });

        describe('vendor prefixes', function() {
            it('vendor prefix in keyword name', function() {
                var match = customSyntax.lexer.matchAtruleDescriptor('-prefix-font-face', 'font-display', swapValue);

                assert(match.matched);
                assert.equal(match.error, null);
            });

            it('vendor prefix in declarator name', function() {
                var match = customSyntax.lexer.matchAtruleDescriptor('font-face', '-prefix-font-display', swapValue);

                assert(match.matched);
                assert.equal(match.error, null);
            });

            it('case insensetive with vendor prefix', function() {
                var match;

                match = customSyntax.lexer.matchAtruleDescriptor('FONT-FACE', 'FONT-DISPLAY', swapValue);
                assert(match.matched);
                assert.equal(match.error, null);

                match = customSyntax.lexer.matchAtruleDescriptor('FONT-face', '-VENDOR-Font-Display', swapValue);
                assert(match.matched);
                assert.equal(match.error, null);
            });

            it('should use verdor version first', function() {
                var defaultSyntax = syntax.definitionSyntax.generate(syntax.lexer.getAtruleDescriptor('font-face', 'font-display').syntax);
                var match;

                match = customSyntax.lexer.matchAtruleDescriptor('font-face', '-foo-font-display', xxxValue);
                assert(match.matched);
                assert.equal(match.error, null);

                match = customSyntax.lexer.matchAtruleDescriptor('font-face', 'font-display', xxxValue);
                assert.equal(match.matched, null);
                assert.equal(match.error.message, 'Mismatch\n  syntax: ' + defaultSyntax + '\n   value: ' + syntax.generate(xxxValue) + '\n  --------^');
            });
        });

        it('should not be matched to empty value', function() {
            var match = syntax.lexer.matchAtruleDescriptor('font-face', 'font-display', parseCss('', { context: 'value', positions: true }));

            assert.equal(match.matched, null);
            assert.equal(match.error.rawMessage, 'Mismatch');
            assert.deepEqual({
                line: match.error.line,
                column: match.error.column
            }, {
                line: 1,
                column: 1
            });
        });

        it('should not be matched to at-rules with no descriptors', function() {
            var match = syntax.lexer.matchAtruleDescriptor('keyframes', 'font-face', swapValue);

            assert.equal(match.matched, null);
            assert.equal(match.error.message, 'At-rule `keyframes` has no known descriptors');
        });

        fixture.forEachAtruleDescriptorTest(createAtruleDescriptorMatchTest);
    });

    describe('matchProperty()', function() {
        var bar = parseCss('bar', { context: 'value' });
        var qux = parseCss('qux', { context: 'value' });
        var customSyntax = syntax.fork(function(prev, assign) {
            return assign(prev, {
                properties: {
                    foo: 'bar',
                    '-baz-foo': 'qux'
                }
            });
        });

        describe('vendor prefixes and hacks', function() {
            it('vendor prefix', function() {
                var match = customSyntax.lexer.matchProperty('-vendor-foo', bar);

                assert(match.matched);
                assert.equal(match.error, null);
            });

            it('hacks', function() {
                var match = customSyntax.lexer.matchProperty('_foo', bar);

                assert(match.matched);
                assert.equal(customSyntax.lexer.lastMatchError, null);
            });

            it('vendor prefix and hack', function() {
                var match = customSyntax.lexer.matchProperty('_-vendor-foo', bar);

                assert(match.matched);
                assert.equal(customSyntax.lexer.lastMatchError, null);
            });

            it('case insensetive with vendor prefix and hack', function() {
                var match;

                match = customSyntax.lexer.matchProperty('FOO', bar);
                assert(match.matched);
                assert.equal(match.error, null);

                match = customSyntax.lexer.matchProperty('-VENDOR-Foo', bar);
                assert(match.matched);
                assert.equal(match.error, null);

                match = customSyntax.lexer.matchProperty('_FOO', bar);
                assert(match.matched);
                assert.equal(match.error, null);

                match = customSyntax.lexer.matchProperty('_-VENDOR-Foo', bar);
                assert(match.matched);
                assert.equal(match.error, null);
            });

            it('should use verdor version first', function() {
                var match;

                match = customSyntax.lexer.matchProperty('-baz-foo', qux);
                assert(match.matched);
                assert.equal(match.error, null);

                match = customSyntax.lexer.matchProperty('-baz-baz-foo', qux);
                assert.equal(match.matched, null);
                assert.equal(match.error.message, 'Unknown property `-baz-baz-foo`');
            });
        });

        it('custom property', function() {
            var match = syntax.lexer.matchProperty('--foo', bar);

            assert.equal(match.matched, null);
            assert.equal(match.error.message, 'Lexer matching doesn\'t applicable for custom properties');
        });

        it('should not be matched to empty value', function() {
            var match = syntax.lexer.matchProperty('color', parseCss('', { context: 'value', positions: true }));

            assert.equal(match.matched, null);
            assert.equal(match.error.rawMessage, 'Mismatch');
            assert.deepEqual({
                line: match.error.line,
                column: match.error.column
            }, {
                line: 1,
                column: 1
            });
        });

        fixture.forEachTest(createMatchTest);
    });

    describe('matchDeclaration()', function() {
        it('should match', function() {
            var declaration = parseCss('color: red', { context: 'declaration' });
            var match = syntax.lexer.matchDeclaration(declaration);

            assert(match.matched);
            assert.equal(match.error, null);
        });
    });

    describe('matchType()', function() {
        var singleNumber = parseCss('1', { context: 'value' });
        var severalNumbers = parseCss('1, 2, 3', { context: 'value' });
        var cssWideKeyword = parseCss('inherit', { context: 'value' });
        var customSyntax = syntax.fork(function(prev, assign) {
            return assign(prev, {
                types: {
                    foo: '<bar>#',
                    bar: '[ 1 | 2 | 3 ]'
                }
            });
        });

        it('should match type', function() {
            var match = customSyntax.lexer.matchType('bar', singleNumber);

            assert(match.matched);
            assert.equal(match.error, null);
        });

        it('should match type using nested', function() {
            var match = customSyntax.lexer.matchType('foo', severalNumbers);

            assert(match.matched);
            assert.equal(match.error, null);
        });

        it('should fail on matching wrong value', function() {
            var match = customSyntax.lexer.matchType('bar', severalNumbers);

            assert.equal(match.matched, null);
            assert.equal(match.error.rawMessage, 'Mismatch');
        });

        it('should return null and save error for unknown type', function() {
            var match = customSyntax.lexer.matchType('baz', singleNumber);

            assert.equal(match.matched, null);
            assert.equal(match.error.message, 'Unknown type `baz`');
        });

        it('should not match to CSS wide names', function() {
            var match = customSyntax.lexer.matchType('foo', cssWideKeyword);

            assert.equal(match.matched, null);
            assert.equal(match.error.message, 'Mismatch\n  syntax: <bar>#\n   value: inherit\n  --------^');
        });
    });

    describe('match()', function() {
        var customSyntax = syntax.fork(function(prev, assign) {
            return assign(prev, {
                types: {
                    foo: '<bar>#',
                    bar: '[ 1 | 2 | 3 ]',
                    fn: 'fn(<foo>)'
                }
            });
        });

        it('should match by type', function() {
            var value = parseCss('fn(1, 2, 3)', { context: 'value' });
            var fn = value.children.first;
            var syntax = customSyntax.lexer.getType('fn');
            var match = customSyntax.lexer.match(syntax, fn);

            assert(match.matched);
            assert.equal(match.error, null);
        });

        it('should take a string as a value', function() {
            var syntax = customSyntax.lexer.getType('fn');
            var match = customSyntax.lexer.match(syntax, 'fn(1, 2, 3)');

            assert(match.matched);
            assert.equal(match.error, null);
        });

        it('should take a string as a syntax', function() {
            var match = customSyntax.lexer.match('fn( <number># )', 'fn(1, 2, 3)');

            assert(match.matched);
            assert.equal(match.error, null);
        });

        it('should fails on bad syntax', function() {
            var value = parseCss('fn(1, 2, 3)', { context: 'value' });
            var fn = value.children.first;
            var match = customSyntax.lexer.match({}, fn);

            assert.equal(match.matched, null);
            assert.equal(match.error.message, 'Bad syntax');
        });
    });

    describe('mismatch node', function() {
        const properties = {
            'test1': '<foo()>',
            'test2': '<bar>',
            'test3': '<baz()>',
            'test4': '<number>{4}',
            'test5': '<number>#{4}'
        };
        var customSyntax = syntax.fork(function(prev, assign) {
            return assign(prev, {
                generic: true,
                properties,
                types: {
                    'foo()': 'foo( <number>#{3} )',
                    'bar': 'bar( <angle> )',
                    'baz()': 'baz( <angle> | <number> )'
                }
            });
        });
        var tests = [
            { property: 'test1', value: 'foo(1, 2px, 3)', column: 8 },
            { property: 'test1', value: 'foo(1, 2, 3, 4)', column: 12 },
            { property: 'test1', value: 'foo(1, 211px)', column: 8 },
            { property: 'test1', value: 'foo(1, 2 3)', column: 10 },
            { property: 'test1', value: 'foo(1, 2)', column: 10 },
            { property: 'test2', value: 'bar( foo )', column: 6 },
            { property: 'test3', value: 'baz( foo )', column: 6 },
            { property: 'test3', value: 'baz( 1px )', column: 6 },
            { property: 'test4', value: '1 2 3', column: 6 },
            { property: 'test5', value: '1, 2, 3', column: 8 },
            { property: 'test5', value: '1, 2, 3,', column: 9 },
            { property: 'test5', value: '1, 2, 3, 4,', column: 11 }
        ];

        tests.forEach(function(test) {
            it('<\'' + test.property + '\'> -> ' + test.value, function() {
                var ast = parseCss(test.value, { context: 'value', positions: true });
                var result = customSyntax.lexer.matchProperty(test.property, ast);
                var error = result.error;

                assert.equal(result.matched, null);
                assert(Boolean(error));
                assert.equal(error.column, test.column);
                assert.equal(error.message, `Mismatch\n  syntax: ${
                    properties[test.property]
                }\n   value: ${
                    syntax.generate(ast)
                }\n  --------${'-'.repeat(error.mismatchOffset)}^`);
            });
        });
    });

    describe('trace', function() {
        var testNode;
        var match;
        var mismatch;

        beforeEach(function() {
            var ast = parseCss('rgb(1, 2, 3)', { context: 'value' });
            testNode = ast.children.first.children.first;
            match = syntax.lexer.matchProperty('background', ast);
            mismatch = syntax.lexer.matchProperty('margin', ast);
        });

        it('getTrace()', function() {
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

        it('isType()', function() {
            assert.equal(match.isType(testNode, 'color'), true);
            assert.equal(match.isType(testNode, 'final-bg-layer'), true);
            assert.equal(match.isType(testNode, 'background-color'), false);
            assert.equal(match.isType(testNode, 'foo'), false);

            assert.equal(mismatch.isType(testNode, 'color'), false);
        });

        it('isProperty()', function() {
            assert.equal(match.isProperty(testNode, 'color'), false);
            assert.equal(match.isProperty(testNode, 'final-bg-layer'), false);
            assert.equal(match.isProperty(testNode, 'background-color'), true);
            assert.equal(match.isProperty(testNode, 'foo'), false);

            assert.equal(mismatch.isProperty(testNode, 'color'), false);
        });

        it('isKeyword()', function() {
            var ast = parseCss('repeat 0', { context: 'value' });
            var keywordNode = ast.children.first;
            var numberNode = ast.children.last;
            var match = syntax.lexer.matchProperty('background', ast);

            assert.equal(match.isKeyword(keywordNode), true);
            assert.equal(match.isKeyword(numberNode), false);
        });
    });

    describe('search', function() {
        function translateFragments(fragments) {
            return fragments.map(function(fragment) {
                return syntax.generate({
                    type: 'Value',
                    loc: null,
                    children: fragment.nodes
                });
            });
        }

        describe('findValueFragments()', function() {
            it('should find single entry', function() {
                var declaration = parseCss('border: 1px solid red', { context: 'declaration' });
                var result = syntax.lexer.findValueFragments(declaration.property, declaration.value, 'Type', 'color');

                assert.deepEqual(translateFragments(result), ['red']);
            });

            it('should find multiple entries', function() {
                var declaration = parseCss('font: 10px Arial, Courier new, Times new roman', { context: 'declaration' });
                var result = syntax.lexer.findValueFragments(declaration.property, declaration.value, 'Type', 'family-name');

                assert.deepEqual(translateFragments(result), ['Arial', 'Courier new', 'Times new roman']);
            });
        });

        describe('findDeclarationValueFragments()', function() {
            it('should find single entry', function() {
                var declaration = parseCss('border: 1px solid red', { context: 'declaration' });
                var result = syntax.lexer.findDeclarationValueFragments(declaration, 'Type', 'color');

                assert.deepEqual(translateFragments(result), ['red']);
            });

            it('should find multiple entries', function() {
                var declaration = parseCss('font: 10px Arial, Courier new, Times new roman', { context: 'declaration' });
                var result = syntax.lexer.findDeclarationValueFragments(declaration, 'Type', 'family-name');

                assert.deepEqual(translateFragments(result), ['Arial', 'Courier new', 'Times new roman']);
            });
        });

        describe('findAllFragments()', function() {
            it('should find all entries in ast', function() {
                var ast = parseCss('foo { border: 1px solid red; } bar { color: rgba(1,2,3,4); border-color: #123 rgb(1,2,3) }');
                var result = syntax.lexer.findAllFragments(ast, 'Type', 'color');

                assert.deepEqual(translateFragments(result), ['red', 'rgba(1,2,3,4)', '#123', 'rgb(1,2,3)']);
            });
        });
    });
});
