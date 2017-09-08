module.exports = {
    parse: {
        prelude: null,
        block: function() {
            return this.Block(this.Declaration);
        }
    }
};
