export default {
    parse: {
        prelude() {
            return this.createSingleNodeList(
                this.LayerNameList()
            );
        },
        block() {
            return this.Block(false);
        }
    }
};
