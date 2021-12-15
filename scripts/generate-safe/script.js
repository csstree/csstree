/* eslint-env browser */
/* global selectedMode, okTests, okTestsCount, failedTestsCount, failedTests */

// Keep `var` in this script since it has to be written in ES5 to able run it in old browsers without transpilation.

var fixture = [];

function test(testcase, mode) {
    var el = document.createElement('div');
    var tester = document.createElement('div');

    var prev = tester.style[testcase.property];
    tester.style[testcase.property] = testcase[mode];
    var next = tester.style[testcase.property];

    el.className = 'testcase';
    el.innerText =
        testcase.id + ' { ' +
        testcase.property + ': ' +
        testcase[mode] + ' } ' +
        (prev === next ? ' / ' + JSON.stringify(prev) + ' -> ' + JSON.stringify(next) : '');

    if (prev !== next) {
        el.style.backgroundColor = '#dfd';
        return { ok: true, el: el };
    } else {
        el.style.backgroundColor = '#fdd';
        return { ok: false, el: el };
    }
}

function runMode(mode) {
    okTests.innerHTML = '';
    failedTests.innerHTML = '';

    for (var i = 0; i < fixture.length; i++) {
        const result = test(fixture[i], mode);

        if (result.ok) {
            okTests.appendChild(result.el);
        } else {
            failedTests.appendChild(result.el);
        }
    }

    okTestsCount.innerText = 'Passed: ' + okTests.children.length;
    failedTestsCount.innerText = 'Failed: ' + failedTests.children.length;
}

runMode(selectedMode.value);
