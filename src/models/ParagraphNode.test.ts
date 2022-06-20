import { FootnoteNode } from "./FootnoteNode";
import { FormatNode } from "./FormatNode";
import { ParagraphNode } from "./ParagraphNode";
import { TextNode } from "./TextNode";

const firstText = new TextNode("This is the first paragraph. What do you think of it?");
const lastText = new TextNode("This is the second paragraph. I think it's redundant.");
const combinedText = new TextNode(firstText.getText() + lastText.getText());
const footnote = new FootnoteNode(new FormatNode("", [ new TextNode("Side note!") ]));
const firstParagraph = new ParagraphNode(0, new FormatNode("", [ firstText, footnote ]))
const lastParagraph = new ParagraphNode(0, new FormatNode("", [ lastText ]))
const combinedParagraph = new ParagraphNode(0, new FormatNode("", [ combinedText, footnote ]))

test("Combine/split", () => {
    expect(firstParagraph.withParagraphAppended(lastParagraph).toBookdown()).toBe(`${firstText.getText()}${footnote.toBookdown()}${lastText.getText()}`)

    const split = combinedParagraph.split({ node: combinedText, index: combinedText.getText().indexOf(".") + 1 })
    expect(split).not.toBeUndefined()
    if(split) {
        expect(split[0].toBookdown()).toBe(firstText.getText().substring(0, firstText.getText().indexOf(".") + 1))
        expect(split[1].toBookdown()).toBe(firstText.getText().substring(firstText.getText().indexOf(".") + 1) + lastText.getText() + footnote.toBookdown())
    }
})