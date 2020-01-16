const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { parse, walk, fork, version } = require('./helpers/lib');
const fixtureFilename = '/fixture/stringify.css';
const fixture = normalize(fs.readFileSync(__dirname + fixtureFilename, 'utf-8'));;
const types = Object.keys(parse.config.node).sort()
    .filter(type => type !== 'DeclarationList'); // DeclarationList doesn't appear in StyleSheet

function normalize(str) {
    return str.replace(/\n|\r\n?|\f/g, '\n');
}

describe('Common', () => {
    it('should expose version', () => {
        assert.strictEqual(version, require('../package.json').version);
    });

    it('JSON.strigify()', () => {
        const ast = parse(fixture, {
            filename: path.basename(fixtureFilename),
            positions: true
        });

        // fs.writeFileSync(__dirname + '/fixture/stringify.ast', stringify(ast, true) + '\n', 'utf-8');

        assert.equal(
            JSON.stringify(ast, null, 4),
            normalize(fs.readFileSync(__dirname + '/fixture/stringify.ast', 'utf-8').trim())
        );
    });

    it('test CSS should contain all node types', () => {
        const foundTypes = new Set();
        const ast = parse(fixture);

        walk(ast, node => foundTypes.add(node.type));

        assert.deepEqual(
            [...foundTypes].sort(),
            types.sort().filter(type => type !== 'WhiteSpace') // FIXME: temporary filter white space
        );
    });

    describe('extension in base classes should not cause to exception', () => {
        beforeEach(() => {
            Object.prototype.objectExtraField = () => {};
            Array.prototype.arrayExtraField = () => {};
        });
        afterEach(() => {
            delete Object.prototype.objectExtraField;
            delete Array.prototype.arrayExtraField;
        });

        it('fork()', () => {
            assert.doesNotThrow(() => {
                fork({
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
