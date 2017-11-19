var {SourceMapConsumer} = require('source-map');
var assert = require('assert');
var parse = require('../lib').parse;
var translateWithSourceMap = require('../lib').translateWithSourceMap;
var forEachParseTest = require('./fixture/parse').forEachTest;
var merge = require('./helpers').merge;

function createTranslateWidthSourceMapTest(name, test) {
    (test.skip ? it.skip : it)(name, function() {
        var ast = parse(test.source, merge(test.options, {
            positions: true
        }));

        // strings should be equal
        assert.equal(translateWithSourceMap(ast).css, 'translate' in test ? test.translate : test.source);
    });
}

function validateMap(map) {
    (new SourceMapConsumer(map)).eachMapping(function (mapping) {
        assert.ok(mapping.generatedColumn != null);
        assert.ok(mapping.generatedLine != null);
        assert.ok(mapping.originalColumn != null);
        assert.ok(mapping.originalLine != null);
    })
}

describe('translateWithSourceMap', function() {
    forEachParseTest(createTranslateWidthSourceMapTest);

    it('should throws on unknown node type', function() {
        assert.throws(function() {
            translateWithSourceMap({
                type: 'xxx'
            });
        }, /Unknown node type/);
    });

    it('should generate a map', function() {
        var source = '.a {\n  color: red;\n}\n';
        var ast = parse(source, {
            filename: 'test.css',
            positions: true
        });
        var result = translateWithSourceMap(ast);

        validateMap(result.map.toJSON());
        assert.equal(result.css, '.a{color:red}');
        assert.equal(result.map.toString(), '{"version":3,"sources":["test.css"],"names":[],"mappings":"AAAA,GACE"}');
    });

    it('complex CSS', function() {
        var source = '.a { color: #ff0000; } .b { display: block; float: left; } @media foo { .c { color: red } }';
        var ast = parse(source, {
            filename: 'test.css',
            positions: true
        });
        var result = translateWithSourceMap(ast);

        validateMap(result.map.toJSON());
        assert.equal(result.css, '.a{color:#ff0000}.b{display:block;float:left}@media foo{.c{color:red}}');
        assert.equal(result.map.toString(), '{"version":3,"sources":["test.css"],"names":[],"mappings":"AAAA,GAAK,cAAkB,GAAK,cAAgB,WAAe,WAAa,GAAK"}');
    });
});
