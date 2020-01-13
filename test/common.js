var fs = require('fs');
var path = require('path');
var assert = require('assert');
var csstree = require('../lib');
var parse = require('../lib').parse;
var walk = require('../lib').walk;
var stringify = require('./helpers/stringify.js');
var fixtureFilename = '/fixture/stringify.css';
var types = Object.keys(require('../lib/syntax/node')).sort().filter(function(type) {
    return type !== 'DeclarationList'; // doesn't appear in StyleSheet
});

function normalize(str) {
    return str.replace(/\n|\r\n?|\f/g, '\n');
}

describe('Common', function() {
    var css;
    var ast;

    before(function() {
        css = normalize(fs.readFileSync(__dirname + fixtureFilename, 'utf-8'));
        ast = parse(css, {
            filename: path.basename(fixtureFilename),
            positions: true
        });

        // fs.writeFileSync(__dirname + '/fixture/stringify.ast', stringify(ast, true) + '\n', 'utf-8');
    });

    it('should expose version', () => {
        assert.strictEqual(csstree.version, require('../package.json').version);
    });

    it('utils.strigify()', function() {
        assert.equal(
            stringify(ast, true),
            normalize(fs.readFileSync(__dirname + '/fixture/stringify.ast', 'utf-8').trim())
        );
    });

    it('test CSS should contain all node types', function() {
        var foundTypes = Object.create(null);

        walk(ast, function(node) {
            foundTypes[node.type] = true;
        });

        assert.deepEqual(
            Object.keys(foundTypes).sort(),
            types.sort()
        );
    });

    describe('extension in base classes should not cause to exception', function() {
        beforeEach(function() {
            Object.prototype.objectExtraField = function() {};
            Array.prototype.arrayExtraField = function() {};
        });
        afterEach(function() {
            delete Object.prototype.objectExtraField;
            delete Array.prototype.arrayExtraField;
        });

        it('fork()', function() {
            assert.doesNotThrow(function() {
                csstree.fork({
                    node: {
                        Test: {
                            structure: {
                                foo: 'Rule',
                                bar: [['Rule']]
                            }
                        }
                    }
                });
            });
        });
    });
});
