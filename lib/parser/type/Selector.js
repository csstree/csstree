module.exports = function Selector() {
    var children = this.readSelectorSequence();

    return {
        type: 'Selector',
        loc: this.getLocationFromList(children),
        children: children
    };
};
