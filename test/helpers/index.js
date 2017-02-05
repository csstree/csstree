function merge(a, b) {
    if (!a) {
        return b;
    } else if (!b) {
        return a;
    }

    var result = {};

    for (var key in a) {
        result[key] = a[key];
    }

    for (var key in b) {
        result[key] = b[key];
    }

    return result;
}

module.exports = {
    merge: merge
};
