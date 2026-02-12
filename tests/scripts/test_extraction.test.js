const {extract} = require("../../src/scripts/extraction")

test("extracts text from URL", () => {
    let content = extract("www.google.com")
    expect(content).toBe(null)
})
