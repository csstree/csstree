var fs = require('fs');
var assert = require('assert');
var parse = require('../lib/parser');
var stringify = require('./helpers/stringify.js');

function normalize(str) {
    return str.replace(/\n|\r\n?|\f/g, '\n');
}

describe('Common', function() {
    it('JSON.strigify()', function() {
        assert.equal(
            stringify(parse('.a\n{\rcolor:\r\nred}', {
                positions: true
            }), true),
            normalize(fs.readFileSync(__dirname + '/fixture/stringify.txt', 'utf-8').trim())
        );
    });
});
