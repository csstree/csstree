'use strict';

var Tokenizer = require('../tokenizer');
var sequence = require('./sequence');
var noop = function() {};

module.exports = function createParser(config) {
    var parser = {
        scanner: new Tokenizer(),
        filename: '<unknown>',
        needPositions: false,
        tolerant: false,
        onParseError: noop,
        parseAtruleExpression: true,
        parseSelector: true,
        parseValue: true,
        parseCustomProperty: false,

        readSequence: sequence,

        tolerantParse: function(consumer, fallback) {
            if (this.tolerant) {
                var start = this.scanner.tokenStart;
                try {
                    return consumer.call(this);
                } catch (e) {
                    this.onParseError(e);
                    return fallback.call(this, start);
                }
            } else {
                return consumer.call(this);
            }
        },

        getLocation: function(start, end) {
            if (this.needPositions) {
                return this.scanner.getLocationRange(
                    start,
                    end,
                    this.filename
                );
            }

            return null;
        },
        getLocationFromList: function(list) {
            if (this.needPositions) {
                return this.scanner.getLocationRange(
                    list.head !== null ? list.first().loc.start.offset - this.scanner.startOffset : this.scanner.tokenStart,
                    list.head !== null ? list.last().loc.end.offset - this.scanner.startOffset : this.scanner.tokenStart,
                    this.filename
                );
            }

            return null;
        },

        parse: function(source, options) {
            options = options || {};

            var context = options.context || 'default';
            var ast;

            this.scanner.setSource(source, options.offset, options.line, options.column);
            this.filename = options.filename || '<unknown>';
            this.needPositions = Boolean(options.positions);
            this.tolerant = Boolean(options.tolerant);
            this.onParseError = typeof options.onParseError === 'function' ? options.onParseError : noop;
            this.parseAtruleExpression = 'parseAtruleExpression' in options ? Boolean(options.parseAtruleExpression) : true;
            this.parseSelector = 'parseSelector' in options ? Boolean(options.parseSelector) : true;
            this.parseValue = 'parseValue' in options ? Boolean(options.parseValue) : true;
            this.parseCustomProperty = 'parseCustomProperty' in options ? Boolean(options.parseCustomProperty) : false;

            if (!this.context.hasOwnProperty(context)) {
                throw new Error('Unknown context `' + context + '`');
            }

            ast = this.context[context].call(this, options);

            if (!this.scanner.eof) {
                this.scanner.error();
            }

            // console.log(JSON.stringify(ast, null, 4));
            return ast;
        }
    };

    for (var key in config) {
        parser[key] = config[key];
    }

    return parser.parse.bind(parser);
};
