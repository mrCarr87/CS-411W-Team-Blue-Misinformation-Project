const test = require('node:test');
const assert = require("assert")
const {extract} = require("../../src/scripts/extraction")

test("extracts text from URL", () => {
    let content = extract("www.google.com")
    assert.strictEqual(content, null)
})
