import assert from 'assert';
import { ident, string, url } from 'css-tree';

function forEachTest(tests, func) {
    Object.keys(tests).forEach((from, idx) => {
        it('(' + idx + ') ' + JSON.stringify(from), () => {
            assert.strictEqual(func(from), tests[from]);
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
                '"\\\r\\\n\\\r\n"': '',
                '"\\"': '"',
                '"\\': '',
                // (35)
                '\\31  b': '1 b'
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
                'a\tb': '"a\\9 b"',
                'a\nbc\n"b\tx': '"a\\a bc\\a\\"b\\9x"',
                'a\\26b': '"a\\\\26b"',
                // (10)
                'a&b': '"a&b"',
                'a&z': '"a&z"',
                '\n b': '"\\a  b"'
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
                // (20)
                'url(\\abcdef1)': '\ufffd1',
                'url(\\)': ')',
                'url(\\': ''
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
                '\u0008': 'url(\\8)',
                '1 b': 'url(1\\ b)',
                '1\n b': 'url(1\\a\\ b)'
            };

            forEachTest(tests, url.encode);
        });
    });

    describe('ident', () => {
        describe('decode', () => {
            const tests = {
                '': '',
                'foo': 'foo',
                'a\\\r\\\n\\\r\nb': 'ab',
                '\\21': '!',
                '\\021': '!',
                // (5)
                '\\0021': '!',
                '\\00021': '!',
                '\\000021': '!',
                '\\0000211': '!1',
                '\\000021 1': '!1',
                // (10)
                '\\000021\t1': '!1',
                '\\0': '\ufffd',
                '\\0x': '\ufffdx',
                '\\abcdefa': '\ufffda',  // is greater than the maximum allowed code point
                '\\def0': '\ufffd',      // is for a surrogate
                // (15)
                '\\00abcdef': '\uabcdef',
                '\\abcdef1': '\ufffd1',
                '\\': '',
                '\\31 \\ b': '1 b',
                '\\31 \\ x': '1 x',
                // (20)
                '\\31 b': '1b',
                '\\31 x': '1x',
                '\\31 ': '1'
            };

            forEachTest(tests, ident.decode);
        });

        describe('encode', () => {
            // Adopted tests: https://github.com/mathiasbynens/CSS.escape/blob/master/tests/tests.js
            const tests = {
                '': '',
                '\0': '\uFFFD',
                'a\0': 'a\uFFFD',
                '\0b': '\uFFFDb',
                'a\0b': 'a\uFFFDb',

                '\uFFFD': '\uFFFD',
                'a\uFFFD': 'a\uFFFD',
                '\uFFFDb': '\uFFFDb',
                'a\uFFFDb': 'a\uFFFDb',

                '\x01\x02\x1E\x1F': '\\1 \\2 \\1e \\1f ',

                // (10)
                '0a': '\\30 a',
                '1a': '\\31 a',
                '2a': '\\32 a',
                '3a': '\\33 a',
                '4a': '\\34 a',
                '5a': '\\35 a',
                '6a': '\\36 a',
                '7a': '\\37 a',
                '8a': '\\38 a',
                '9a': '\\39 a',

                // (20)
                'a0b': 'a0b',
                'a1b': 'a1b',
                'a2b': 'a2b',
                'a3b': 'a3b',
                'a4b': 'a4b',
                'a5b': 'a5b',
                'a6b': 'a6b',
                'a7b': 'a7b',
                'a8b': 'a8b',
                'a9b': 'a9b',

                // (30)
                '-0a': '-\\30 a',
                '-1a': '-\\31 a',
                '-2a': '-\\32 a',
                '-3a': '-\\33 a',
                '-4a': '-\\34 a',
                '-5a': '-\\35 a',
                '-6a': '-\\36 a',
                '-7a': '-\\37 a',
                '-8a': '-\\38 a',
                '-9a': '-\\39 a',

                // (40)
                '-': '\\-',
                '-a': '-a',
                '--': '--',
                '--a': '--a',

                '\x80\x2D\x5F\xA9': '\x80\x2D\x5F\xA9',
                '\x7F\x80\x81\x82\x83\x84\x85\x86\x87\x88\x89\x8A\x8B\x8C\x8D\x8E\x8F\x90\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9A\x9B\x9C\x9D\x9E\x9F': '\\7f \x80\x81\x82\x83\x84\x85\x86\x87\x88\x89\x8A\x8B\x8C\x8D\x8E\x8F\x90\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9A\x9B\x9C\x9D\x9E\x9F',
                '\xA0\xA1\xA2': '\xA0\xA1\xA2',
                'a0123456789b': 'a0123456789b',
                'abcdefghijklmnopqrstuvwxyz': 'abcdefghijklmnopqrstuvwxyz',
                'ABCDEFGHIJKLMNOPQRSTUVWXYZ': 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',

                // (50)
                '\x20\x21\x78\x79': '\\ \\!xy',

                // astral symbol (U+1D306 TETRAGRAM FOR CENTRE)
                '\uD834\uDF06': '\uD834\uDF06',
                // lone surrogates
                '\uDF06': '\uDF06',
                '\uD834': '\uD834',

                '1 b': '\\31 \\ b',
                // (55)
                '1 x': '\\31 \\ x',
                '1b': '\\31 b',
                '1x': '\\31 x',
                '1': '\\31 '
            };

            forEachTest(tests, ident.encode);
        });
    });
});
