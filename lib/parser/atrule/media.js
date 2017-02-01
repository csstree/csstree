module.exports = {
    expression: function() {
        return this.MediaQueryList();
    },
    block: function() {
        return this.Block(this.Rule);
    }
};
