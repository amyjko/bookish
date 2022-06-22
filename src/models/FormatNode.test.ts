import { FormatNode } from "./FormatNode"
import { TextNode } from "./TextNode"

test("Bold first two characters", () => {
    const text = new TextNode("Hello");
    const format = new FormatNode("", [ text ]);
    expect(format.withFormat({ start: { node: text, index: 0 }, end: { node: text, index: 2 }}, "*")?.toBookdown()).toBe("*He*llo");
})

test("Unbold word", () => {
    const text = new TextNode("Hello");
    const format = new FormatNode("", [ new FormatNode("*", [ text ] ) ]);
    expect(format.withFormat({ start: { node: text, index: 0 }, end: { node: text, index: 5 }}, "")?.toBookdown()).toBe("Hello");
})

test("Bold single caret position", () => {
    const text = new TextNode("Hello");
    const format = new FormatNode("", [ text ]);
    expect(format.withFormat({ start: { node: text, index: 2 }, end: { node: text, index: 2 }}, "*")?.toBookdown()).toBe("He**llo");
})

test("Delete first two characters", () => {
    const text = new TextNode("Hello");
    const format = new FormatNode("", [ text ]);
    expect(format.withoutRange({ start: { node: text, index: 0 }, end: { node: text, index: 2 }})?.toBookdown()).toBe("llo");
})

test("Delete characters crossing format boundary", () => {
    const text = new TextNode("He");
    const bolded = new TextNode("ll");
    const format = new FormatNode("", [ text, new FormatNode("*", [ bolded ]), new TextNode("o") ]);
    expect(format.withoutRange({ start: { node: text, index: 1 }, end: { node: bolded, index: 1 }})?.toBookdown()).toBe("H*l*o");
})

test("Split", () => {
    const text = new TextNode("This is my paragraph. It is two sentences.");
    const indexAfterPeriod = text.getText().indexOf(".") + 1;
    const caret = { node: text, index: indexAfterPeriod };
    const format = new FormatNode("", [ text ]);
    expect(format.split(caret)?.map(t => t.toBookdown()).join("THEN")).toBe("This is my paragraph.THEN It is two sentences.");
})

test("Backspace/delete", () => {

    const first = new TextNode("Hello, my name is ");
    const second = new TextNode("Amy");
    const third = new TextNode(".");
    const format = new FormatNode("", [ first, new FormatNode("*", [ second ]), third ]);

    expect(format.withoutCharacter({ node: first, index: 5}, false)?.root.toBookdown())
        .toBe("Hell, my name is *Amy*.")
    expect(format.withoutCharacter({ node: first, index: 5}, true)?.root.toBookdown())
        .toBe("Hello my name is *Amy*.")
    expect(format.withoutCharacter({ node: second, index: 0}, false)?.root.toBookdown())
        .toBe("Hello, my name is*Amy*.")
    expect(format.withoutCharacter({ node: second, index: 0}, true)?.root.toBookdown())
        .toBe("Hello, my name is *my*.")
    expect(format.withoutCharacter({ node: first, index: 0}, false)?.root.toBookdown())
        .toBeUndefined()
    expect(format.withoutCharacter({ node: third, index: 1}, true)?.root.toBookdown())
        .toBeUndefined()
})