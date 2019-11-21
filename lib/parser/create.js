const OffsetToLocation = require('../common/OffsetToLocation');
const SyntaxError = require('../common/SyntaxError');
const TokenStream = require('../common/TokenStream');
const List = require('../common/List');
const tokenize = require('../tokenizer');
const { TYPE, NAME } = require('../tokenizer/const');
const { findWhiteSpaceStart, cmpChar, cmpStr } = require('../tokenizer/utils');
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
    let source = '';
    let filename = '<unknown>';
    let needPositions = false;
    let onParseError = noop;
    let onParseErrorThrow = false;

    const locationMap = new OffsetToLocation();
    const parser = Object.assign(new TokenStream(), processConfig(config || {}), {
        parseAtrulePrelude: true,
        parseRulePrelude: true,
        parseValue: true,
        parseCustomProperty: false,

        readSequence: sequence,

        createList() {
            return new List();
        },
        createSingleNodeList(node) {
            return new List().appendData(node);
        },
        getFirstListNode(list) {
            return list && list.first();
        },
        getLastListNode(list) {
            return list.last();
        },

        parseWithFallback(consumer, fallback) {
            const startToken = this.tokenIndex;

            try {
                return consumer.call(this);
            } catch (e) {
                if (onParseErrorThrow) {
                    throw e;
                }

                const fallbackNode = fallback.call(this, startToken);

                onParseErrorThrow = true;
                onParseError(e, fallbackNode);
                onParseErrorThrow = false;

                return fallbackNode;
            }
        },

        lookupNonWSType(offset) {
            let type;

            do {
                type = this.lookupType(offset++);
                if (type !== WHITESPACE) {
                    return type;
                }
            } while (type !== NULL);

            return NULL;
        },

        eat(tokenType) {
            if (this.tokenType !== tokenType) {
                let offset = this.tokenStart;
                let message = NAME[tokenType] + ' is expected';

                // tweak message and offset
                switch (tokenType) {
                    case IDENT:
                        // when identifier is expected but there is a function or url
                        if (this.tokenType === FUNCTION || this.tokenType === URL) {
                            offset = this.tokenEnd - 1;
                            message = 'Identifier is expected but function found';
                        } else {
                            message = 'Identifier is expected';
                        }
                        break;

                    case HASH:
                        if (this.isDelim(NUMBERSIGN)) {
                            this.next();
                            offset++;
                            message = 'Name is expected';
                        }
                        break;

                    case PERCENTAGE:
                        if (this.tokenType === NUMBER) {
                            offset = this.tokenEnd;
                            message = 'Percent sign is expected';
                        }
                        break;

                    default:
                        // when test type is part of another token show error for current position + 1
                        // e.g. eat(HYPHENMINUS) will fail on "-foo", but pointing on "-" is odd
                        if (this.charCodeAt(this.tokenStart) === tokenType) {
                            offset = offset + 1;
                        }
                }

                this.error(message, offset);
            }

            this.next();
        },

        charCodeAt(index) {
            return index >= 0 && index < source.length ? source.charCodeAt(index) : 0;
        },
        cmpChar(index, expected) {
            return cmpChar(source, index, expected);
        },
        cmpStr(start, end, expected) {
            return cmpStr(source, start, end, expected);
        },
        substring(start, end) {
            return source.substring(start, end);
        },

        consume(tokenType) {
            const value = this.getTokenValue();

            this.eat(tokenType);

            return value;
        },
        consumeFunctionName() {
            const name = source.substring(this.tokenStart, this.tokenEnd - 1);

            this.eat(FUNCTION);

            return name;
        },

        getLocation(start, end) {
            if (needPositions) {
                return locationMap.getLocationRange(
                    start,
                    end,
                    filename
                );
            }

            return null;
        },
        getLocationFromList(list) {
            if (needPositions) {
                const head = this.getFirstListNode(list);
                const tail = this.getLastListNode(list);
                return locationMap.getLocationRange(
                    head !== null ? head.loc.start.offset - locationMap.startOffset : this.tokenStart,
                    tail !== null ? tail.loc.end.offset - locationMap.startOffset : this.tokenStart,
                    filename
                );
            }

            return null;
        },

        error(message, offset) {
            const location = typeof offset !== 'undefined' && offset < source.length
                ? locationMap.getLocation(offset)
                : this.eof
                    ? locationMap.getLocation(findWhiteSpaceStart(source, source.length - 1))
                    : locationMap.getLocation(this.tokenStart);

            throw new SyntaxError(
                message || 'Unexpected input',
                source,
                location.offset,
                location.line,
                location.column
            );
        }
    });

    return function(source_, options) {
        source = source_;
        options = options || {};

        tokenize(source, parser);
        locationMap.setSource(
            source,
            options.offset,
            options.line,
            options.column
        );

        filename = options.filename || '<unknown>';
        needPositions = Boolean(options.positions);
        onParseError = typeof options.onParseError === 'function' ? options.onParseError : noop;
        onParseErrorThrow = false;

        parser.parseAtrulePrelude = 'parseAtrulePrelude' in options ? Boolean(options.parseAtrulePrelude) : true;
        parser.parseRulePrelude = 'parseRulePrelude' in options ? Boolean(options.parseRulePrelude) : true;
        parser.parseValue = 'parseValue' in options ? Boolean(options.parseValue) : true;
        parser.parseCustomProperty = 'parseCustomProperty' in options ? Boolean(options.parseCustomProperty) : false;

        const { context = 'default' } = options;

        if (!parser.context.has(context)) {
            throw new Error('Unknown context `' + context + '`');
        }

        const ast = parser.context.get(context).call(parser, options);

        if (!parser.eof) {
            parser.error();
        }

        return ast;
    };
};
