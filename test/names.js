const assert = require('assert');
const { keyword, property, isCustomProperty, vendorPrefix } = require('./helpers/lib');

describe('names utils', () => {
    describe('keyword', () => {
        it('base test', () => {
            assert.deepEqual(keyword('test'), {
                name: 'test',
                basename: 'test',
                prefix: '',
                vendor: '',
                custom: false
            });
        });

        it('result should be immutable', () => {
            const data = keyword('test');
            data.name = 'xxx';
            assert.deepEqual(data, {
                name: 'test',
                basename: 'test',
                prefix: '',
                vendor: '',
                custom: false
            });
        });

        it('should normalize name to lower case', () => {
            assert.deepEqual(keyword('TesT'), {
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
                    assert.deepEqual(keyword(vendor + 'test'), {
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
                    assert.notEqual(test, test.toLowerCase()); // guard
                    assert.strictEqual(keyword(test), keyword(test.toLowerCase()));
                });
            });
        });

        it('shouldn\'t detect a verdor prefix for name that doesn\'t starts with dash', () => {
            assert.deepEqual(keyword('test-vendor-test'), {
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
                    assert.deepEqual(keyword(test), {
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
            assert.deepEqual(property('test'), {
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
            data.name = 'xxx';
            assert.deepEqual(data, {
                name: 'test',
                basename: 'test',
                custom: false,
                prefix: '',
                hack: '',
                vendor: ''
            });
        });

        it('should normalize name to lower case', () => {
            assert.deepEqual(property('TesT'), {
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
                    assert.deepEqual(property(vendor + 'test'), {
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
                assert.deepEqual(property('-a-test-test'), {
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
            assert.deepEqual(property('-VenDor-TesT'), {
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
                    assert.deepEqual(property(hack + 'test'), {
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
            assert.deepEqual(property('--test'), {
                name: '--test',
                basename: '--test',
                custom: true,
                prefix: '',
                hack: '',
                vendor: ''
            });
        });

        it('should detect vendor prefix and hack', () => {
            assert.deepEqual(property('//-moz-test'), {
                name: '-moz-test',
                basename: 'test',
                custom: false,
                prefix: '//-moz-',
                hack: '//',
                vendor: '-moz-'
            });
        });

        it('should detect custom property and hack', () => {
            assert.deepEqual(property('//--test'), {
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
                    assert.notEqual(test, test.toLowerCase()); // guard
                    assert.strictEqual(property(test), property(test.toLowerCase()));
                });
            });
        });

        it('shouldn\'t detect a verdor prefix for name that doesn\'t starts with dash', () => {
            assert.deepEqual(property('test-vendor-test'), {
                name: 'test-vendor-test',
                basename: 'test-vendor-test',
                custom: false,
                prefix: '',
                hack: '',
                vendor: ''
            });
        });

        it('shouldn\'t normalize custom property names', () => {
            assert.deepEqual(property('--Test-Custom'), {
                name: '--Test-Custom',
                basename: '--Test-Custom',
                custom: true,
                prefix: '',
                hack: '',
                vendor: ''
            });

            assert.deepEqual(property('--TEST-custom'), {
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
                    assert.deepEqual(property(test), {
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
                assert.equal(isCustomProperty(test), data[test]);
            });

            it('\'$' + test + '\' with offset 1', () => {
                assert.equal(isCustomProperty('$' + test, 1), data[test]);
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
                assert.equal(vendorPrefix(test), data[test]);
            });

            it('\'$' + test + '\' with offset 1', () => {
                assert.equal(vendorPrefix('$' + test, 1), data[test]);
            });
        });
    });
});
