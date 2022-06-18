import { FormatNode } from "./FormatNode"
import { TextNode } from "./TextNode"

test("Bold first two characters", () => {
    const text = new TextNode("Hello");
    const format = new FormatNode("", [ text ]);
    expect(format.withFormat({ start: { node: text, index: 0 }, end: { node: text, index: 2 }}, "*")?.toBookdown()).toBe("*He*llo");
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