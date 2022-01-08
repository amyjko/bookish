import Parser from "./Parser"

test("Empty chapter", () => {
    expect(Parser.parseChapter(null, "").toText()).toBe("")
})

test("Single paragraph", () => {
    expect(Parser.parseChapter(null, "hello").toText()).toBe("hello")
})