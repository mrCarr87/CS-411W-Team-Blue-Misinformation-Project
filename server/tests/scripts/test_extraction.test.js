const test = require('node:test');
const assert = require("assert")
const {query, extract_first} = require("../../scripts/extraction.js")

test("extracts text from URL", async () => {
    let content = await extract_first("https://mrcarr87.github.io/CS-410---Team-Blue---Misinformation-Project/")
    let text = "Misinformation is an increasing problem in today's society. With social media, internet access, and mass media now the forefront of public knowledge, the threat of misleading or outright wrong information is the new digital threat. This project serves as an active defense against this world-wide threat and a call to do research on all topics the public is faced with."
    assert.strictEqual(content, text)
})
