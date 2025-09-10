import { tokenize, tokenTypes, generate } from 'css-tree';

function num(postfix = '') {
    return [
        '-.5', '-1', '-1e-2', '-1e2', '-1.5',
        '0',
        '.5', '1', '1e-2', '1e2', '1.5'
    ].map(v => v + postfix);
}

const tokenTypeKey = new Map(Object.entries(tokenTypes).map(([k, v]) => [v, k]));
const fixtureTokens = {
    Ident: ['foo', '--foo', '--'],
    Function: ['fn(', '--fn(', '--('],
    AtKeyword: ['@test'],
    Hash: ['#f00'],
    String: ['"foo"', "'foo'"],
    // BadString: ['"foo', "'foo"],
    Url: ['url(#)'],
    // BadUrl: ['url(#'],
    Delim: ['@', '#', '-', '+', '.', '/', '*', '%'],
    Number: num(),
    Percentage: num('%'),
    Dimension: num('px'),
    CDO: ['<!--'],
    CDC: ['-->'],
    Colon: [':'],
    Semicolon: [';'],
    Comma: [','],
    LeftSquareBracket: ['['],
    RightSquareBracket: [']'],
    LeftParenthesis: ['('],
    RightParenthesis: [')'],
    LeftCurlyBracket: ['{'],
    RightCurlyBracket: ['}'],
    Comment: ['/**/']
};
const fixtureTokenTypes = Object.keys(fixtureTokens);
export const fixture = [];

for (const leftType of fixtureTokenTypes) {
    fixtureTokens[leftType].forEach((leftValue, leftIndex) => {
        for (const rightType of fixtureTokenTypes) {
            fixtureTokens[rightType].forEach((rightValue, rightIndex) => {
                const id = `${leftType}[${leftIndex}]/${rightType}[${rightIndex}]`;
                const source = `${leftValue}${rightValue}`;
                const tokens = [];

                tokenize(source, (type, start, end) => {
                    tokens.push({
                        type: tokenTypeKey.get(type),
                        value: source.slice(start, end)
                    });
                });

                // if (tokens.length === 2 && (tokens[0].type !== leftType || tokens[1].type !== rightType)) {
                //     console.error('Unexpected tokenize result');
                //     console.error('Input:', source);
                //     console.error('Tokens:', JSON.stringify(tokens, null, 4));
                //     process.exit();
                // }

                const noWsNeeded =
                    tokens.length === 2 &&
                    tokens[0].type === leftType &&
                    tokens[0].value === leftValue &&
                    tokens[1].type === rightType &&
                    tokens[1].value === rightValue;

                // if (id === 'Comment[0]/LeftCurlyBracket[0]') {
                //     console.error('Unexpected tokenize result');
                //     console.error('Input:', source);
                //     console.error({
                //         leftType,
                //         leftValue,
                //         rightType,
                //         rightValue
                //     })
                //     console.error('Tokens:', JSON.stringify(tokens, null, 4));
                //     process.exit();
                // }

                fixture.push({
                    id,
                    ws: !noWsNeeded,
                    left: {
                        type: leftType,
                        value: leftValue
                    },
                    right: {
                        type: rightType,
                        value: rightValue
                    },
                    ...tokens
                });
            });
        }
    });
}

// uncomment to validate fixtures
false && fixture.forEach(fixture => {
    const {
        ws,
        left: { value: leftValue },
        right: { value: rightValue }
    } = fixture;

    const actual = generate({
        type: 'Value',
        children: [
            { type: 'Raw', value: leftValue },
            { type: 'Raw', value: rightValue }
        ]
    }, { mode: 'spec' });
    const expectedNoWs = `${leftValue}${rightValue}`;
    const expectedWs = `${leftValue} ${rightValue}`;

    if (ws) {
        if (actual !== expectedWs) {
            console.log({
                actual,
                expected: expectedWs,
                fixture
            });
        }
    } else {
        if (actual !== expectedNoWs) {
            if (actual === expectedWs) {
                return;
            }

            console.log({
                actual,
                expected: expectedNoWs,
                fixture
            });
        }
    }
});
