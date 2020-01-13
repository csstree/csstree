const fs = require('fs');
const path = require('path');
const assert = require('assert');
const csstree = require('../lib');
const fixtureFilename = '/fixture/stringify.css';
const types = Object.keys(csstree.parse.config.node).sort()
    .filter(type => type !== 'DeclarationList'); // DeclarationList doesn't appear in StyleSheet

function normalize(str) {
    return str.replace(/\n|\r\n?|\f/g, '\n');
}

describe('Common', () => {
    let css;
    let ast;

    before(() => {
        css = normalize(fs.readFileSync(__dirname + fixtureFilename, 'utf-8'));
        ast = csstree.parse(css, {
            filename: path.basename(fixtureFilename),
            positions: true
        });

        // fs.writeFileSync(__dirname + '/fixture/stringify.ast', stringify(ast, true) + '\n', 'utf-8');
    });

    it('utils.strigify()', () =>
        assert.equal(
            JSON.stringify(ast, null, 4),
            normalize(fs.readFileSync(__dirname + '/fixture/stringify.ast', 'utf-8').trim())
        )
    );

    it('test CSS should contain all node types', () => {
        const foundTypes = new Set();

        csstree.walk(ast, node => foundTypes.add(node.type));

        assert.deepEqual(
            [...foundTypes].sort(),
            types.sort()
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
