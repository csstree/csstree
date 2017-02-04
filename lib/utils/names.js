'use strict';

var hasOwnProperty = Object.prototype.hasOwnProperty;
var keywords = Object.create(null);
var properties = Object.create(null);
var HYPHENMINUS = 45; // '-'.charCodeAt()

function getVendorPrefix(str, offset) {
    // if starts with two dashes it's a custom property name
    if (str.charCodeAt(offset) === HYPHENMINUS &&
        str.charCodeAt(offset + 1) !== HYPHENMINUS) {

        // vendor should contain at least one letter
        var secondDashIndex = str.indexOf('-', offset + 2);

        if (secondDashIndex !== -1) {
            return str.substring(offset, secondDashIndex + 1);
        }
    }

    return '';
}

function getKeywordInfo(keyword) {
    if (hasOwnProperty.call(keywords, keyword)) {
        return keywords[keyword];
    }

    var lowerCaseKeyword = keyword.toLowerCase();

    if (hasOwnProperty.call(keywords, lowerCaseKeyword)) {
        return keywords[keyword] = keywords[lowerCaseKeyword];
    }

    var vendor = getVendorPrefix(lowerCaseKeyword, 0);
    var name = lowerCaseKeyword;

    if (vendor) {
        name = name.substr(vendor.length);
    }

    return keywords[keyword] = Object.freeze({
        vendor: vendor,
        prefix: vendor,
        name: name
    });
}

function getPropertyInfo(property) {
    if (hasOwnProperty.call(properties, property)) {
        return properties[property];
    }

    var lowerCaseProperty = property.toLowerCase();

    if (hasOwnProperty.call(properties, lowerCaseProperty)) {
        return properties[lowerCaseProperty];
    }

    var hack = property[0];

    if (hack === '/' && property[1] === '/') {
        hack = '//';
    } else if (hack !== '*' && hack !== '_' && hack !== '$') {
        hack = '';
    }

    var vendor = getVendorPrefix(lowerCaseProperty, hack.length);

    if (vendor.length > 0 || hack.length > 0) {
        lowerCaseProperty = lowerCaseProperty.substr(hack.length + vendor.length);
    }

    return properties[property] = properties[lowerCaseProperty] = Object.freeze({
        hack: hack,
        vendor: vendor,
        prefix: hack + vendor,
        name: lowerCaseProperty
    });
}

module.exports = {
    keyword: getKeywordInfo,
    property: getPropertyInfo
};
