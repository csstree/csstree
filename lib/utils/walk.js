'use strict';

function walkRules(node, item, list) {
    switch (node.type) {
        case 'StyleSheet':
            var oldStylesheet = this.stylesheet;
            this.stylesheet = node;

            node.children.each(walkRules, this);

            this.stylesheet = oldStylesheet;
            break;

        case 'Atrule':
            if (node.block !== null) {
                walkRules.call(this, node.block);
            }

            this.fn(node, item, list);
            break;

        case 'Rule':
            this.fn(node, item, list);

            var oldRule = this.rule;
            this.rule = node;

            node.block.children.each(walkRules, this);

            this.rule = oldRule;
            break;
    }

}

function walkRulesRight(node, item, list) {
    switch (node.type) {
        case 'StyleSheet':
            var oldStylesheet = this.stylesheet;
            this.stylesheet = node;

            node.children.eachRight(walkRulesRight, this);

            this.stylesheet = oldStylesheet;
            break;

        case 'Atrule':
            if (node.block !== null) {
                walkRulesRight.call(this, node.block);
            }

            this.fn(node, item, list);
            break;

        case 'Rule':
            var oldRule = this.rule;
            this.rule = node;

            node.block.children.eachRight(walkRulesRight, this);

            this.rule = oldRule;

            this.fn(node, item, list);
            break;
    }
}

function walkDeclarations(node) {
    switch (node.type) {
        case 'StyleSheet':
            var oldStylesheet = this.stylesheet;
            this.stylesheet = node;

            node.children.each(walkDeclarations, this);

            this.stylesheet = oldStylesheet;
            break;

        case 'Atrule':
            if (node.block !== null) {
                walkDeclarations.call(this, node.block);
            }
            break;

        case 'Rule':
            var oldRule = this.rule;
            this.rule = node;

            if (node.block !== null) {
                walkDeclarations.call(this, node.block);
            }

            this.rule = oldRule;
            break;

        case 'Block':
            node.children.each(function(node, item, list) {
                if (node.type === 'Declaration') {
                    this.fn(node, item, list);
                } else {
                    walkDeclarations.call(this, node);
                }
            }, this);
            break;
    }
}

function walkAll(node, item, list) {
    this.fn(node, item, list);
    walk.call(this, walkAll, node, item, list);
}

function walkAllUp(node, item, list) {
    walk.call(this, walkAllUp, node, item, list);
    this.fn(node, item, list);
}

function walk(walk, node) {
    switch (node.type) {
        case 'StyleSheet':
            var oldStylesheet = this.stylesheet;
            this.stylesheet = node;

            node.children.each(walk, this);

            this.stylesheet = oldStylesheet;
            break;

        case 'Atrule':
            if (node.expression !== null) {
                walk.call(this, node.expression);
            }
            if (node.block !== null) {
                walk.call(this, node.block);
            }
            break;

        case 'Rule':
            this.rule = node;

            if (node.selector !== null) {
                walk.call(this, node.selector);
            }
            walk.call(this, node.block);

            this.rule = null;
            break;

        case 'SelectorList':
            var oldSelector = this.selector;
            this.selector = node;

            node.children.each(walk, this);

            this.selector = oldSelector;
            break;

        case 'Nth':
            walk.call(this, node.nth);
            if (node.selector !== null) {
                walk.call(this, node.selector);
            }
            break;

        case 'Block':
            node.children.each(walk, this);
            break;

        case 'Declaration':
            this.declaration = node;

            walk.call(this, node.value);

            this.declaration = null;
            break;

        case 'Attribute':
            walk.call(this, node.name);
            if (node.value !== null) {
                walk.call(this, node.value);
            }
            break;

        case 'PseudoClass':
            if (node.children !== null) {
                this['function'] = node;

                node.children.each(walk, this);

                this['function'] = null;
            }
            break;

        case 'PseudoElement':
            if (node.children !== null) {
                this['function'] = node;

                node.children.each(walk, this);

                this['function'] = null;
            }
            break;

        case 'Function':
            this['function'] = node;

            node.children.each(walk, this);

            this['function'] = null;
            break;

        case 'AtruleExpression':
            this.atruleExpression = node;

            node.children.each(walk, this);

            this.atruleExpression = null;
            break;

        case 'Selector':
        case 'Value':
        case 'Parentheses':
        case 'Brackets':
            node.children.each(walk, this);
            break;

        case 'Url':
            walk.call(this, node.value);
            break;

        // nothig to do with
        // case 'Progid':
        // case 'Property':
        // case 'Combinator':
        // case 'Dimension':
        // case 'Hash':
        // case 'Type':
        // case 'Universal':
        // case 'Identifier':
        // case 'UnicodeRange':
        // case 'An+B':
        // case 'Class':
        // case 'Id':
        // case 'Percentage':
        // case 'Space':
        // case 'Number':
        // case 'String':
        // case 'Operator':
        // case 'Raw':
    }
}

function createContext(root, fn) {
    var context = {
        fn: fn,
        root: root,
        stylesheet: null,
        atruleExpression: null,
        rule: null,
        selector: null,
        declaration: null,
        function: null
    };

    return context;
}

module.exports = {
    all: function(root, fn) {
        walkAll.call(createContext(root, fn), root);
    },
    allUp: function(root, fn) {
        walkAllUp.call(createContext(root, fn), root);
    },
    rules: function(root, fn) {
        walkRules.call(createContext(root, fn), root);
    },
    rulesRight: function(root, fn) {
        walkRulesRight.call(createContext(root, fn), root);
    },
    declarations: function(root, fn) {
        walkDeclarations.call(createContext(root, fn), root);
    }
};
