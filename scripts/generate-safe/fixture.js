import { tokenize, tokenTypes, generate } from 'css-tree';

function num(postfix = '') {
    return [
        '-.5', '-1', '-1.5',
        '0',
        '.5', '1', '1.5'
    ].map(v => v + postfix);
}

const tokenTypeKey = new Map(Object.entries(tokenTypes).map(([k, v]) => [v, k]));
const fixtureTokens = {
    Ident: ['solid'],
    Function: ['calc('],
    AtKeyword: ['@test'],
    Hash: ['#f00'],
    String: ['"foo"', "'foo'"],
    // BadString: ['"foo', "'foo"],
    Url: ['url(#)'],
    // BadUrl: ['url(#'],
    // Delim: ['-', '+', '/'],
    Number: num(),
    Percentage: num('%'),
    Dimension: num('px')
    // CDO: ['<!--'],
    // CDC: ['-->'],
    // Colon: [':'],
    // Semicolon: [';'],
    // Comma: [','],
    // LeftSquareBracket: ['['],
    // RightSquareBracket: [']'],
    // LeftParenthesis: ['('],
    // RightParenthesis: [')'],
    // LeftCurlyBracket: ['{'],
    // RightCurlyBracket: ['}'],
    // Comment: ['/**/']
};
const fixtureTokenTypes = Object.keys(fixtureTokens);
const pairToProperty = [].concat(...[
    {
        property: 'margin',
        left: ['Percentage', 'Dimension', 'Function:calc(1px)'],
        right: ['Percentage', 'Dimension', 'Function:calc(1px)']
    },
    {
        property: 'border-color',
        left: ['Ident:red', 'Hash', 'Function:rgb(1,2,3)'],
        right: ['Ident:red', 'Hash', 'Function:rgb(1,2,3)']
    },
    {
        property: 'border',
        left: ['Ident:solid', 'Dimension:2px'],
        right: ['Hash']
    },
    {
        property: 'background',
        symetric: true,
        left: ['Url', 'Percentage', 'Dimension'],
        right: ['Ident:red', 'Hash', 'Function:rgb(1,2,3)', 'Percentage', 'Dimension']
    },
    {
        property: 'content',
        symetric: true,
        left: ['String'],
        right: ['Function:attr(foo)', 'String']
    }
].map(({ left, right, symetric, ...rest }) => symetric
    ? [{ left, right, ...rest }, { left: right, right: left, ...rest }]
    : [{ left, right, ...rest }]
));
export const fixture = [];
const coveredPairs = new Set();
const uncoveredPairs = new Set();
let ignoredPairsCount = 0;

function unpackTerm(term) {
    let [type, values] = term.split(':');

    if (values === undefined) {
        values = fixtureTokens[type];
    } else {
        values = [values];
    }

    return [type, values];
}

function isWsNeeded(leftType, leftValue, rightType, rightValue) {
    const source = `${leftValue}${rightValue}`;
    const tokens = [];

    tokenize(source, (type, start, end) => {
        tokens.push({
            type: tokenTypeKey.get(type),
            value: source.slice(start, end)
        });
    });

    return (
        tokens.length !== 2 ||
        tokens[0].type !== leftType ||
        tokens[0].value !== leftValue ||
        tokens[1].type !== rightType ||
        tokens[1].value !== rightValue
    );
}

function generateTokens(leftValue, rightValue, mode) {
    return generate({
        type: 'Value',
        children: [
            { type: 'Raw', value: leftValue },
            { type: 'Raw', value: rightValue }
        ]
    }, { mode });
}

for (const pair of pairToProperty) {
    const { property, left, right } = pair;

    left.forEach((leftTerm, leftTermIndex) => {
        let [leftType, leftValues] = unpackTerm(leftTerm);

        right.forEach((rightTerm, rightTermIndex) => {
            let [rightType, rightValues] = unpackTerm(rightTerm);

            leftValues.forEach((leftValue, leftValueIndex) => {
                rightValues.forEach((rightValue, rightValueIndex) => {
                    const id = `${leftType}-${leftTermIndex}-${leftValueIndex}__${rightType}-${rightTermIndex}-${rightValueIndex}`;
                    const leftToken = leftType === 'Function' ? ')' : leftValue;
                    const rightToken = rightType === 'Function' ? 'fn(' : rightValue;
                    const needWs = isWsNeeded(
                        leftType === 'Function' ? 'RightParenthesis' : leftType,
                        leftToken,
                        rightType,
                        rightToken
                    );

                    coveredPairs.add(`${leftType}/${rightType}`);

                    if (!needWs) {
                        fixture.push({
                            id,
                            property,
                            spec: generateTokens(leftValue, rightValue, 'spec'),
                            safe: generateTokens(leftValue, rightValue, 'safe')
                        });
                    } else {
                        ignoredPairsCount++;
                    }
                });
            });
        });
    });
}

for (const leftType of fixtureTokenTypes) {
    for (const rightType of fixtureTokenTypes) {
        const pair = `${leftType}/${rightType}`;

        if (!coveredPairs.has(pair)) {
            uncoveredPairs.add(pair);
        }
    }
}

// const ignoreSafe = [
//     'AtKeyword',
//     // BadString
//     // BadUrl
//     'CDO',
//     'CDC',
//     'Colon',
//     'Semicolon',
//     'Comma',
//     'LeftSquareBracket',
//     'RightSquareBracket',
//     'LeftCurlyBracket',
//     'RightCurlyBracket',
//     'Comment'
// ];
// const ignoreSafeLeft = [...ignoreSafe, 'Function', 'LeftParenthesis'];
// const ignoreSafeRight = [...ignoreSafe, 'RightParenthesis'];
// const ignoreSafeValues = ['@', '#', '.', '*', '%'];
// console.log(fixture.filter(fixture =>
//     !fixture.ws &&
//     !ignoreSafeLeft.includes(fixture.left.type) &&
//     !ignoreSafeValues.includes(fixture.left.value) &&
//     !ignoreSafeRight.includes(fixture.right.type) &&
//     !ignoreSafeValues.includes(fixture.right.value)
// ));

false && console.log({
    cases: fixture.length,
    ignoredPairsCount,
    coveredPairsCount: coveredPairs.size,
    uncoveredPairsCount: uncoveredPairs.size,
    uncoveredPairs
});

// console.log(uncoveredPairs);
