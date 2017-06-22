var assert = require('assert');
var keyword = require('../lib').keyword;
var property = require('../lib').property;

describe('names utils', function() {
    describe('keyword', function() {
        it('base test', function() {
            assert.deepEqual(keyword('test'), {
                name: 'test',
                prefix: '',
                vendor: ''
            });
        });

        it('result should be immutable', function() {
            var data = keyword('test');
            data.name = 'xxx';
            assert.deepEqual(data, {
                name: 'test',
                prefix: '',
                vendor: ''
            });
        });

        it('should normalize name to lower case', function() {
            assert.deepEqual(keyword('TesT'), {
                name: 'test',
                prefix: '',
                vendor: ''
            });
        });

        describe('should detect vendor prefixes', function() {
            ['-moz-', '-o-', '-webkit-', '-ms-', '-any-'].forEach(function(vendor) {
                it(vendor, function() {
                    assert.deepEqual(keyword(vendor + 'test'), {
                        name: 'test',
                        prefix: vendor,
                        vendor: vendor
                    });
                });
            });
        });

        it('should return the same object', function() {
            assert(keyword('test') === keyword('test'));
        });

        describe('should return the same object for normalized names', function() {
            ['Test', '-MOZ-Test'].forEach(function(test) {
                it(test, function() {
                    assert(test !== test.toLowerCase(), 'should difer from lower case'); // guard
                    assert(keyword(test) === keyword(test.toLowerCase()), 'object should be the same');
                });
            });
        });

        it('shouldn\'t detect a verdor prefix for name that doesn\'t starts with dash', function() {
            assert.deepEqual(keyword('test-vendor-test'), {
                name: 'test-vendor-test',
                prefix: '',
                vendor: ''
            });
        });

        describe('shouldn\'t detect custom property name as verdor prefix', function() {
            ['--test', '--vendor-test', '--vendor-test-test'].forEach(function(test) {
                it(test, function() {
                    assert.deepEqual(keyword(test), {
                        name: test,
                        prefix: '',
                        vendor: ''
                    });
                });
            });
        });
    });

    describe('property', function() {
        it('base test', function() {
            assert.deepEqual(property('test'), {
                name: 'test',
                custom: false,
                prefix: '',
                hack: '',
                vendor: ''
            });
        });

        it('result should be immutable', function() {
            var data = property('test');
            data.name = 'xxx';
            assert.deepEqual(data, {
                name: 'test',
                custom: false,
                prefix: '',
                hack: '',
                vendor: ''
            });
        });

        it('should normalize name to lower case', function() {
            assert.deepEqual(property('TesT'), {
                name: 'test',
                custom: false,
                prefix: '',
                hack: '',
                vendor: ''
            });
        });

        describe('should detect vendor prefixes', function() {
            ['-moz-', '-o-', '-webkit-', '-ms-', '-any-'].forEach(function(vendor) {
                it(vendor, function() {
                    assert.deepEqual(property(vendor + 'test'), {
                        name: 'test',
                        custom: false,
                        prefix: vendor,
                        hack: '',
                        vendor: vendor
                    });
                });
            });

            it('name with dashes', function() {
                assert.deepEqual(property('-a-test-test'), {
                    name: 'test-test',
                    custom: false,
                    prefix: '-a-',
                    hack: '',
                    vendor: '-a-'
                });
            });
        });

        it('should normalize vendor to lower case', function() {
            assert.deepEqual(property('-VenDor-TesT'), {
                name: 'test',
                custom: false,
                prefix: '-vendor-',
                hack: '',
                vendor: '-vendor-'
            });
        });

        describe('should detect hacks', function() {
            ['*', '_', '$', '#', '+', '//'].forEach(function(hack) {
                it(hack, function() {
                    assert.deepEqual(property(hack + 'test'), {
                        name: 'test',
                        custom: false,
                        prefix: hack,
                        hack: hack,
                        vendor: ''
                    });
                });
            });
        });

        it('should detect custom property', function() {
            assert.deepEqual(property('--test'), {
                name: '--test',
                custom: true,
                prefix: '',
                hack: '',
                vendor: ''
            });
        });

        it('should detect vendor prefix and hack', function() {
            assert.deepEqual(property('//-moz-test'), {
                name: 'test',
                custom: false,
                prefix: '//-moz-',
                hack: '//',
                vendor: '-moz-'
            });
        });

        it('should detect custom property and hack', function() {
            assert.deepEqual(property('//--test'), {
                name: '--test',
                custom: true,
                prefix: '//',
                hack: '//',
                vendor: ''
            });
        });

        it('should return the same object', function() {
            assert(property('test') === property('test'));
        });

        describe('should return the same object for normalized names', function() {
            ['Test', '-MOZ-Test', '//Test', '//-MOZ-Test'].forEach(function(test) {
                it(test, function() {
                    assert(test !== test.toLowerCase(), 'should difer from lower case'); // guard
                    assert(property(test) === property(test.toLowerCase()), 'object should be the same');
                });
            });
        });

        it('shouldn\'t detect a verdor prefix for name that doesn\'t starts with dash', function() {
            assert.deepEqual(property('test-vendor-test'), {
                name: 'test-vendor-test',
                custom: false,
                prefix: '',
                hack: '',
                vendor: ''
            });
        });

        it('shouldn\'t normalize custom property names', function() {
            assert.deepEqual(property('--Test-Custom'), {
                name: '--Test-Custom',
                custom: true,
                prefix: '',
                hack: '',
                vendor: ''
            });

            assert.deepEqual(property('--TEST-custom'), {
                name: '--TEST-custom',
                custom: true,
                prefix: '',
                hack: '',
                vendor: ''
            });

            assert(property('--Test') !== property('--test'));
        });

        describe('shouldn\'t detect a verdor prefix for custom property names', function() {
            ['--test', '--vendor-test', '--vendor-test-test'].forEach(function(test) {
                it(test, function() {
                    assert.deepEqual(property(test), {
                        name: test,
                        custom: true,
                        prefix: '',
                        hack: '',
                        vendor: ''
                    });
                });
            });
        });
    });
});
