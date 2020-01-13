const hasOwnProperty = Object.prototype.hasOwnProperty;
const keywords = Object.create(null);
const properties = Object.create(null);
const HYPHENMINUS = 45; // '-'.charCodeAt()

function isCustomProperty(str, offset) {
    offset = offset || 0;

    return str.length - offset >= 2 &&
           str.charCodeAt(offset) === HYPHENMINUS &&
           str.charCodeAt(offset + 1) === HYPHENMINUS;
}

function getVendorPrefix(str, offset) {
    offset = offset || 0;

    // verdor prefix should be at least 3 chars length
    if (str.length - offset >= 3) {
        // vendor prefix starts with hyper minus following non-hyper minus
        if (str.charCodeAt(offset) === HYPHENMINUS &&
            str.charCodeAt(offset + 1) !== HYPHENMINUS) {
            // vendor prefix should contain a hyper minus at the ending
            const secondDashIndex = str.indexOf('-', offset + 2);

            if (secondDashIndex !== -1) {
                return str.substring(offset, secondDashIndex + 1);
            }
        }
    }

    return '';
}

function getKeywordDescriptor(keyword) {
    if (hasOwnProperty.call(keywords, keyword)) {
        return keywords[keyword];
    }

    const name = keyword.toLowerCase();

    if (hasOwnProperty.call(keywords, name)) {
        return keywords[keyword] = keywords[name];
    }

    const custom = isCustomProperty(name, 0);
    const vendor = !custom ? getVendorPrefix(name, 0) : '';

    return keywords[keyword] = Object.freeze({
        basename: name.substr(vendor.length),
        name,
        prefix: vendor,
        vendor,
        custom
    });
}

function getPropertyDescriptor(property) {
    if (hasOwnProperty.call(properties, property)) {
        return properties[property];
    }

    let name = property;
    let hack = property[0];

    if (hack === '/') {
        hack = property[1] === '/' ? '//' : '/';
    } else if (hack !== '_' &&
               hack !== '*' &&
               hack !== '$' &&
               hack !== '#' &&
               hack !== '+' &&
               hack !== '&') {
        hack = '';
    }

    const custom = isCustomProperty(name, hack.length);

    // re-use result when possible (the same as for lower case)
    if (!custom) {
        name = name.toLowerCase();
        if (hasOwnProperty.call(properties, name)) {
            return properties[property] = properties[name];
        }
    }

    const vendor = !custom ? getVendorPrefix(name, hack.length) : '';
    const prefix = name.substr(0, hack.length + vendor.length);

    return properties[property] = Object.freeze({
        basename: name.substr(prefix.length),
        name: name.substr(hack.length),
        hack,
        vendor,
        prefix,
        custom
    });
}

module.exports = {
    keyword: getKeywordDescriptor,
    property: getPropertyDescriptor,
    isCustomProperty,
    vendorPrefix: getVendorPrefix
};
