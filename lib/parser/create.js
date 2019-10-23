const OffsetToLocation = require('../common/OffsetToLocation');
const SyntaxError = require('../common/SyntaxError');
const TokenStream = require('../common/TokenStream');
const List = require('../common/List');
const tokenize = require('../tokenizer');
const { TYPE, NAME } = require('../tokenizer/const');
const { findWhiteSpaceStart } = require('../tokenizer/utils');
const sequence = require('./sequence');
const noop = function() {};

const WHITESPACE = TYPE.WhiteSpace;
const IDENT = TYPE.Ident;
const FUNCTION = TYPE.Function;
const URL = TYPE.Url;
const HASH = TYPE.Hash;
const PERCENTAGE = TYPE.Percentage;
const NUMBER = TYPE.Number;
const NUMBERSIGN = 0x0023; // U+0023 NUMBER SIGN (#)
const NULL = 0;

function createParseContext(name) {
    return function() {
        return this[name]();
    };
}

function processConfig(config) {
    const parserConfig = {
        context: new Map(),
        scope: {},
        atrule: {},
        pseudo: {}
    };

    if (config.parseContext) {
        for (let name in config.parseContext) {
            switch (typeof config.parseContext[name]) {
                case 'function':
                    parserConfig.context.set(name, config.parseContext[name]);
                    break;

                case 'string':
                    parserConfig.context.set(name, createParseContext(config.parseContext[name]));
                    break;
            }
        }
    }

    if (config.scope) {
        for (let name in config.scope) {
            parserConfig.scope[name] = config.scope[name];
        }
    }

    if (config.atrule) {
        for (let name in config.atrule) {
            const atrule = config.atrule[name];

            if (atrule.parse) {
                parserConfig.atrule[name] = atrule.parse;
            }
        }
    }

    if (config.pseudo) {
        for (let name in config.pseudo) {
            const pseudo = config.pseudo[name];

            if (pseudo.parse) {
                parserConfig.pseudo[name] = pseudo.parse;
            }
        }
    }

    if (config.node) {
        for (let name in config.node) {
            parserConfig[name] = config.node[name].parse;
        }
    }

    return parserConfig;
}

module.exports = function createParser(config) {
    const locationMap = new OffsetToLocation();
    const parser = Object.assign({}, processConfig(config || {}), {
        scanner: new TokenStream(),

        filename: '<unknown>',
        needPositions: false,
        onParseError: noop,
        onParseErrorThrow: false,
        parseAtrulePrelude: true,
        parseRulePrelude: true,
        parseValue: true,
        parseCustomProperty: false,

        readSequence: sequence,

        createList: function() {
            return new List();
        },
        createSingleNodeList: function(node) {
            return new List().appendData(node);
        },
        getFirstListNode: function(list) {
            return list && list.first();
        },
        getLastListNode: function(list) {
            return list.last();
        },

        parseWithFallback: function(consumer, fallback) {
            const startToken = this.scanner.tokenIndex;

            try {
                return consumer.call(this);
            } catch (e) {
                if (this.onParseErrorThrow) {
                    throw e;
                }

                const fallbackNode = fallback.call(this, startToken);

                this.onParseErrorThrow = true;
                this.onParseError(e, fallbackNode);
                this.onParseErrorThrow = false;

                return fallbackNode;
            }
        },

        lookupNonWSType: function(offset) {
            let type;

            do {
                type = this.scanner.lookupType(offset++);
                if (type !== WHITESPACE) {
                    return type;
                }
            } while (type !== NULL);

            return NULL;
        },

        eat: function(tokenType) {
            if (this.scanner.tokenType !== tokenType) {
                let offset = this.scanner.tokenStart;
                let message = NAME[tokenType] + ' is expected';

                // tweak message and offset
                switch (tokenType) {
                    case IDENT:
                        // when identifier is expected but there is a function or url
                        if (this.scanner.tokenType === FUNCTION || this.scanner.tokenType === URL) {
                            offset = this.scanner.tokenEnd - 1;
                            message = 'Identifier is expected but function found';
                        } else {
                            message = 'Identifier is expected';
                        }
                        break;

                    case HASH:
                        if (this.scanner.isDelim(NUMBERSIGN)) {
                            this.scanner.next();
                            offset++;
                            message = 'Name is expected';
                        }
                        break;

                    case PERCENTAGE:
                        if (this.scanner.tokenType === NUMBER) {
                            offset = this.scanner.tokenEnd;
                            message = 'Percent sign is expected';
                        }
                        break;

                    default:
                        // when test type is part of another token show error for current position + 1
                        // e.g. eat(HYPHENMINUS) will fail on "-foo", but pointing on "-" is odd
                        if (this.scanner.source.charCodeAt(this.scanner.tokenStart) === tokenType) {
                            offset = offset + 1;
                        }
                }

                this.error(message, offset);
            }

            this.scanner.next();
        },

        consume: function(tokenType) {
            const value = this.scanner.getTokenValue();

            this.eat(tokenType);

            return value;
        },
        consumeFunctionName: function() {
            const name = this.scanner.source.substring(this.scanner.tokenStart, this.scanner.tokenEnd - 1);

            this.eat(FUNCTION);

            return name;
        },

        getLocation: function(start, end) {
            if (this.needPositions) {
                return locationMap.getLocationRange(
                    start,
                    end,
                    this.filename
                );
            }

            return null;
        },
        getLocationFromList: function(list) {
            if (this.needPositions) {
                const head = this.getFirstListNode(list);
                const tail = this.getLastListNode(list);
                return locationMap.getLocationRange(
                    head !== null ? head.loc.start.offset - locationMap.startOffset : this.scanner.tokenStart,
                    tail !== null ? tail.loc.end.offset - locationMap.startOffset : this.scanner.tokenStart,
                    this.filename
                );
            }

            return null;
        },

        error: function(message, offset) {
            const location = typeof offset !== 'undefined' && offset < this.scanner.source.length
                ? locationMap.getLocation(offset)
                : this.scanner.eof
                    ? locationMap.getLocation(findWhiteSpaceStart(this.scanner.source, this.scanner.source.length - 1))
                    : locationMap.getLocation(this.scanner.tokenStart);

            throw new SyntaxError(
                message || 'Unexpected input',
                this.scanner.source,
                location.offset,
                location.line,
                location.column
            );
        }
    });

    return function(source, options) {
        options = options || {};

        tokenize(source, parser.scanner);
        locationMap.setSource(
            source,
            options.offset,
            options.line,
            options.column
        );

        parser.filename = options.filename || '<unknown>';
        parser.needPositions = Boolean(options.positions);
        parser.onParseError = typeof options.onParseError === 'function' ? options.onParseError : noop;
        parser.onParseErrorThrow = false;

        parser.parseAtrulePrelude = 'parseAtrulePrelude' in options ? Boolean(options.parseAtrulePrelude) : true;
        parser.parseRulePrelude = 'parseRulePrelude' in options ? Boolean(options.parseRulePrelude) : true;
        parser.parseValue = 'parseValue' in options ? Boolean(options.parseValue) : true;
        parser.parseCustomProperty = 'parseCustomProperty' in options ? Boolean(options.parseCustomProperty) : false;

        const { context = 'default' } = options;

        if (!parser.context.has(context)) {
            throw new Error('Unknown context `' + context + '`');
        }

        const ast = parser.context.get(context).call(parser, options);

        if (!parser.scanner.eof) {
            parser.error();
        }

        return ast;
    };
};
