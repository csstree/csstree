var fs = require('fs');
var assert = require('assert');
var parse = require('../lib/parser.js');
var SourceMapConsumer = require('source-map').SourceMapConsumer;
var translateWithSourceMap = require('../lib/utils/translateWithSourceMap.js');
var forEachTest = require('./fixture/parse').forEachTest;
var css = '.a { color: #ff0000; }\n.b { display: block; float: left; }';
var minifiedCss = '.a{color:red}.b{display:block;float:left}';
var anonymousMap = defineSourceMap('<unknown>');
var filenameMap = defineSourceMap('test.css');
var points = ['.a', 'color', '.b', 'display', 'float'];

function getOriginalPosition(str, source, filename) {
    var index = source.indexOf(str);
    var line = null;
    var column = null;

    if (index !== -1) {
        var lines = source.substr(0, index).split('\n');
        line = lines.length;
        column = lines.pop().length;
    }

    return {
        source: filename || '<unknown>',
        line: line,
        column: column,
        name: null
    };
}

function getGeneratedPosition(str, source) {
    var index = source.indexOf(str);
    var line = null;
    var column = null;

    if (index !== -1) {
        var lines = source.substr(0, index).split('\n');
        line = lines.length;
        column = lines.pop().length;
    }

    return {
        line: line,
        column: column,
        lastColumn: null
    };
}

function defineSourceMap(filename) {
    var string = '{"version":3,"sources":["' + filename + '"],"names":[],"mappings":"AAAA,E,CAAK,S,CACL,E,CAAK,a,CAAgB,U","file":"' + filename + '","sourcesContent":[' + JSON.stringify(css) + ']}';
    var base64 = new Buffer(string, 'utf8').toString('base64');
    var inline = '/*# sourceMappingURL=data:application/json;base64,' + base64 + ' */';

    return {
        string: string,
        base64: base64,
        inline: inline
    };
}

function extractSourceMap(source) {
    var m = source.match(/\/\*# sourceMappingURL=data:application\/json;base64,(.+) \*\//);

    if (m) {
        return new Buffer(m[1], 'base64').toString();
    }
}

function createTranslateWidthSourceMapTest(name, test, context) {
    it(name, function() {
        var ast = parse(test.source, {
            context: context,
            positions: true
        });

        // strings should be equal
        assert.equal(translateWithSourceMap(ast).css, 'translate' in test ? test.translate : test.source);
    });
}

describe('sourceMaps', function() {
    describe('translateWithSourceMap', function() {
        forEachTest(createTranslateWidthSourceMapTest);
    });
});
