export const name = 'CompoundSelector';
export const structure = {
    children: [[
        'TypeSelector',
        'IdSelector',
        'ClassSelector',
        'AttributeSelector',
        'PseudoClassSelector',
        'PseudoElementSelector',
        'Combinator',
        'WhiteSpace'
    ]]
};

export function parse() {
    const children = this.readSequence(this.scope.Selector);

    // nothing were consumed
    if (this.getFirstListNode(children) === null) {
        this.error('Selector is expected');
    }

    // Selector Contains Combinator
    children.forEach((entry) => {
        if (entry.type === 'Combinator') {
            this.error('CompoundSelector is expected');
        }
    });

    return {
        type: 'Selector', // Report as Selector
        loc: this.getLocationFromList(children),
        children
    };
}

export function generate(node) {
    this.children(node);
}
