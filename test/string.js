var assert = require('assert');
var decode = require('../lib/utils/string').decode;
var encode = require('../lib/utils/string').encode;

describe('string', function() {
    describe('decode', function() {
        var tests = {
            '': '',
            '"': '',
            '\'': '',
            '""': '',
            '\'\'': '',
            // (5)
            '"\'': '\'',
            '\'"': '"',
            '"\\""': '"',
            '"\'"': '\'',
            '"\\"': '"',
            // (10)
            '\'\\\'': '\'',
            '"\\': '',
            '\'\\': '',
            '"a\\\nb"': 'ab',
            '"a\\\rb"': 'ab',
            // (15)
            '"a\\\fb"': 'ab',
            '"\\21"': '!',
            '"\\021"': '!',
            '"\\0021"': '!',
            '"\\00021"': '!',
            // (20)
            '"\\000021"': '!',
            '"\\0000211"': '!1',
            '"\\000021 1"': '!1',
            '"\\000021\t1"': '!1',
            '"\\0"': '\ufffd',
            // (25)
            '"\\0x"': '\ufffdx',
            '"\\abcdefa"': '\ufffda',  // is greater than the maximum allowed code point
            '"\\def0"': '\ufffd',      // is for a surrogate
            '"\\00abcdef"': '\uabcdef',
            '"\\abcdef1"': '\ufffd1',
            // (30)
            '"\\a\\d\\c\\9"': '\n\r\f\t',
            '"\\(\\)\\\\"': '()\\'
        };

        Object.keys(tests).forEach(function(from, idx) {
            it('(' + idx + ') ' + from, function() {
                assert.equal(decode(from), tests[from]);
            });
        });
    });

    describe('encode', function() {
        var tests = {
            '': '""',
            '"': '"\\""',
            '\'': '"\'"',
            'a\nb': '"a\\a b"',
            'a\rb': '"a\\d b"',
            'a\fb': '"a\\c b"',
            'a\tb': '"a\\9 b"',
            'a\tx': '"a\\9x"',
            'a\nbc\n"b\tx': '"a\\a bc\\a\\"b\\9x"'
        };

        Object.keys(tests).forEach(function(from, idx) {
            it('(' + idx + ') ' + from, function() {
                assert.equal(encode(from), tests[from]);
            });
        });
    });
});
