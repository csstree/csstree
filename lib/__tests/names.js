import assert from 'assert';
import { keyword, property, isCustomProperty, vendorPrefix } from 'css-tree';

describe('names utils', () => {
    describe('keyword', () => {
        it('base test', () => {
            assert.deepStrictEqual(keyword('test'), {
                name: 'test',
                basename: 'test',
                prefix: '',
                vendor: '',
                custom: false
            });
        });

        it('result should be immutable', () => {
            const data = keyword('test');
            try {
                data.name = 'xxx';
            } catch {}
            assert.deepStrictEqual(data, {
                name: 'test',
                basename: 'test',
                prefix: '',
                vendor: '',
                custom: false
            });
        });

        it('should normalize name to lower case', () => {
            assert.deepStrictEqual(keyword('TesT'), {
                name: 'test',
                basename: 'test',
                prefix: '',
                vendor: '',
                custom: false
            });
        });

        describe('should detect vendor prefixes', () => {
            ['-moz-', '-o-', '-webkit-', '-ms-', '-any-'].forEach(function(vendor) {
                it(vendor, () => {
                    assert.deepStrictEqual(keyword(vendor + 'test'), {
                        name: vendor + 'test',
                        basename: 'test',
                        prefix: vendor,
                        vendor,
                        custom: false
                    });
                });
            });
        });

        it('should return the same object', () => {
            assert.strictEqual(keyword('test'), keyword('test'));
        });

        describe('should return the same object for normalized names', () => {
            ['Test', '-MOZ-Test'].forEach(function(test) {
                it(test, () => {
                    assert.notStrictEqual(test, test.toLowerCase()); // guard
                    assert.strictEqual(keyword(test), keyword(test.toLowerCase()));
                });
            });
        });

        it('shouldn\'t detect a verdor prefix for name that doesn\'t starts with dash', () => {
            assert.deepStrictEqual(keyword('test-vendor-test'), {
                name: 'test-vendor-test',
                basename: 'test-vendor-test',
                prefix: '',
                vendor: '',
                custom: false
            });
        });

        describe('shouldn\'t detect custom property name as verdor prefix', () => {
            ['--test', '--vendor-test', '--vendor-test-test'].forEach(function(test) {
                it(test, () => {
                    assert.deepStrictEqual(keyword(test), {
                        name: test,
                        basename: test,
                        prefix: '',
                        vendor: '',
                        custom: true
                    });
                });
            });
        });
    });

    describe('property', () => {
        it('base test', () => {
            assert.deepStrictEqual(property('test'), {
                name: 'test',
                basename: 'test',
                custom: false,
                prefix: '',
                hack: '',
                vendor: ''
            });
        });

        it('result should be immutable', () => {
            const data = property('test');
            try {
                data.name = 'xxx';
            } catch {}
            assert.deepStrictEqual(data, {
                name: 'test',
                basename: 'test',
                custom: false,
                prefix: '',
                hack: '',
                vendor: ''
            });
        });

        it('should normalize name to lower case', () => {
            assert.deepStrictEqual(property('TesT'), {
                name: 'test',
                basename: 'test',
                custom: false,
                prefix: '',
                hack: '',
                vendor: ''
            });
        });

        describe('should detect vendor prefixes', () => {
            ['-moz-', '-o-', '-webkit-', '-ms-', '-any-'].forEach(function(vendor) {
                it(vendor, () => {
                    assert.deepStrictEqual(property(vendor + 'test'), {
                        name: vendor + 'test',
                        basename: 'test',
                        custom: false,
                        prefix: vendor,
                        hack: '',
                        vendor
                    });
                });
            });

            it('name with dashes', () => {
                assert.deepStrictEqual(property('-a-test-test'), {
                    name: '-a-test-test',
                    basename: 'test-test',
                    custom: false,
                    prefix: '-a-',
                    hack: '',
                    vendor: '-a-'
                });
            });
        });

        it('should normalize vendor to lower case', () => {
            assert.deepStrictEqual(property('-VenDor-TesT'), {
                name: '-vendor-test',
                basename: 'test',
                custom: false,
                prefix: '-vendor-',
                hack: '',
                vendor: '-vendor-'
            });
        });

        describe('should detect hacks', () => {
            ['*', '_', '$', '#', '+', '&', '//', '/'].forEach(function(hack) {
                it(hack, () => {
                    assert.deepStrictEqual(property(hack + 'test'), {
                        name: 'test',
                        basename: 'test',
                        custom: false,
                        prefix: hack,
                        hack,
                        vendor: ''
                    });
                });
            });
        });

        it('should detect custom property', () => {
            assert.deepStrictEqual(property('--test'), {
                name: '--test',
                basename: '--test',
                custom: true,
                prefix: '',
                hack: '',
                vendor: ''
            });
        });

        it('should detect vendor prefix and hack', () => {
            assert.deepStrictEqual(property('//-moz-test'), {
                name: '-moz-test',
                basename: 'test',
                custom: false,
                prefix: '//-moz-',
                hack: '//',
                vendor: '-moz-'
            });
        });

        it('should detect custom property and hack', () => {
            assert.deepStrictEqual(property('//--test'), {
                name: '--test',
                basename: '--test',
                custom: true,
                prefix: '//',
                hack: '//',
                vendor: ''
            });
        });

        it('should return the same object', () => {
            assert.strictEqual(property('test'), property('test'));
        });

        describe('should return the same object for normalized names', () => {
            ['Test', '-MOZ-Test', '//Test', '//-MOZ-Test'].forEach(function(test) {
                it(test, () => {
                    assert.notStrictEqual(test, test.toLowerCase()); // guard
                    assert.strictEqual(property(test), property(test.toLowerCase()));
                });
            });
        });

        it('shouldn\'t detect a verdor prefix for name that doesn\'t starts with dash', () => {
            assert.deepStrictEqual(property('test-vendor-test'), {
                name: 'test-vendor-test',
                basename: 'test-vendor-test',
                custom: false,
                prefix: '',
                hack: '',
                vendor: ''
            });
        });

        it('shouldn\'t normalize custom property names', () => {
            assert.deepStrictEqual(property('--Test-Custom'), {
                name: '--Test-Custom',
                basename: '--Test-Custom',
                custom: true,
                prefix: '',
                hack: '',
                vendor: ''
            });

            assert.deepStrictEqual(property('--TEST-custom'), {
                name: '--TEST-custom',
                basename: '--TEST-custom',
                custom: true,
                prefix: '',
                hack: '',
                vendor: ''
            });

            assert.notStrictEqual(property('--Test'), property('--test'));
        });

        describe('shouldn\'t detect a verdor prefix for custom property names', () => {
            ['--test', '--vendor-test', '--vendor-test-test'].forEach(function(test) {
                it(test, () => {
                    assert.deepStrictEqual(property(test), {
                        name: test,
                        basename: test,
                        custom: true,
                        prefix: '',
                        hack: '',
                        vendor: ''
                    });
                });
            });
        });
    });

    describe('isCustomProperty', () => {
        const data = {
            '': false,
            '-': false,
            '--': true,
            '---': true,
            '--a': true
        };

        Object.keys(data).forEach(test => {
            it('\'' + test + '\'', () => {
                assert.strictEqual(isCustomProperty(test), data[test]);
            });

            it('\'$' + test + '\' with offset 1', () => {
                assert.strictEqual(isCustomProperty('$' + test, 1), data[test]);
            });
        });
    });

    describe('vendorPrefix', () => {
        const data = {
            '': '',
            '-': '',
            '--': '',
            '-a-': '-a-',
            '-a-b': '-a-',
            '--a': '',
            '--a-': ''
        };

        Object.keys(data).forEach(test => {
            it('\'' + test + '\'', () => {
                assert.strictEqual(vendorPrefix(test), data[test]);
            });

            it('\'$' + test + '\' with offset 1', () => {
                assert.strictEqual(vendorPrefix('$' + test, 1), data[test]);
            });
        });
    });
});
