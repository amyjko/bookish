import Parser from "./Parser"

test("Empty chapter", () => {
    expect(Parser.parseChapter(undefined, "").toText()).toBe("")
})

test("Single paragraph", () => {
    expect(Parser.parseChapter(undefined, "hello").toText()).toBe("hello")
})

test("Peek", () => {

    const p = new Parser(undefined, "# hello")
    expect(p.peek()).toBe("#")
    expect(p.read()).toBe("#")
    expect(p.peek()).toBe(" ")
    
})

test("More", () => {

    const p = new Parser(undefined, "#")
    expect(p.more()).toBe(true)

    const p2 = new Parser(undefined, "")
    expect(p2.more()).toBe(false)
    
})

test("Whitespace", () => {

    const p = new Parser(undefined, "    Hi")
    p.readWhitespace()
    expect(p.peek()).toBe("H")
    
})