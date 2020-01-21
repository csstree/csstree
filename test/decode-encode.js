const assert = require('assert');
const { string, url } = require('../lib');

function forEachTest(tests, func) {
    Object.keys(tests).forEach((from, idx) => {
        it('(' + idx + ') ' + JSON.stringify(from), () => {
            assert.equal(func(from), tests[from]);
        });
    });
}

describe('decode/encode', () => {
    describe('string', () => {
        describe('decode', () => {
            const tests = {
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
                '"\\(\\)\\\\"': '()\\',
                '"\\\r\\\n\\\r\n"': ''
            };

            forEachTest(tests, string.decode);
        });

        describe('encode', () => {
            const tests = {
                '': '""',
                '"': '"\\""',
                '\'': '"\'"',
                'a\nb': '"a\\a b"',
                'a\nz': '"a\\az"',
                // (5)
                'a\rb': '"a\\d b"',
                'a\fb': '"a\\c b"',
                'a\tb': '"a\tb"',
                'a\nbc\n"b\tx': '"a\\a bc\\a\\"b\tx"',
                'a\\26b': '"a\\\\26b"',
                // (10)
                'a&b': '"a&b"',
                'a&z': '"a&z"'
            };

            forEachTest(tests, string.encode);
        });
    });

    describe('url', () => {
        describe('decode', () => {
            const tests = {
                'url(': '',
                'url(foo': 'foo',
                'url(foo)': 'foo',
                'url(  foo  )': 'foo',
                'url(  1\\ \\(2\\).jpg  )': '1 (2).jpg',
                // (5)
                'url(  \\"\\\'\\(\\)\\ \\\\ )': '"\'() \\',
                'url(  a\\\r\\\n\\\r\nb  )': 'ab',
                'url(\\21)': '!',
                'url(\\021)': '!',
                'url(\\0021)': '!',
                // (10)
                'url(\\00021)': '!',
                'url(\\000021)': '!',
                'url(\\0000211)': '!1',
                'url(\\000021 1)': '!1',
                'url(\\000021\t1)': '!1',
                // (15)
                'url(\\0)': '\ufffd',
                'url(\\0x)': '\ufffdx',
                'url(\\abcdefa)': '\ufffda',  // is greater than the maximum allowed code point
                'url(\\def0)': '\ufffd',      // is for a surrogate
                'url(\\00abcdef)': '\uabcdef',
                'url(\\abcdef1)': '\ufffd1'
            };

            forEachTest(tests, url.decode);
        });

        describe('encode', () => {
            const tests = {
                '': 'url()',
                '"': 'url(\\")',
                '\'': 'url(\\\')',
                'a\nb': 'url(a\\a b)',
                'a\nz': 'url(a\\az)',
                // (5)
                'a\rb': 'url(a\\d b)',
                'a\fb': 'url(a\\c b)',
                'a\tb': 'url(a\\9 b)',
                'a\nbc\n"b\tx': 'url(a\\a bc\\a\\"b\\9x)',
                'a\\26b': 'url(a\\\\26b)',
                // (10)
                '1 (2).jpg': 'url(1\\ \\(2\\).jpg)',
                '"\'() \\': 'url(\\"\\\'\\(\\)\\ \\\\)',
                '\u0008': 'url(\\8)'
            };

            forEachTest(tests, url.encode);
        });
    });
});
