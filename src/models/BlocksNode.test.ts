import { CalloutNode } from "./CalloutNode";
import { ChapterNode } from "./ChapterNode";
import { FootnoteNode } from "./FootnoteNode";
import { FormatNode } from "./FormatNode";
import { ListNode } from "./ListNode";
import { ParagraphNode } from "./ParagraphNode";
import { RuleNode } from "./RuleNode";
import { TextNode } from "./TextNode";

const firstText = "First paragraph."
const firstTextNode = new TextNode(firstText);
const firstFormat = new FormatNode("", [ firstTextNode ])
const firstParagraph = new ParagraphNode(0, firstFormat)
const lastText = "Last paragraph."
const lastTextNode = new TextNode(lastText);
const lastFormat = new FormatNode("", [ lastTextNode ]);
const lastParagraph = new ParagraphNode(0, lastFormat)

const footnoteText = new TextNode("This is my footnote.");
const footnote = new FootnoteNode(new FormatNode("", [ footnoteText ]))

const paragraphChapter = new ChapterNode([ firstParagraph, lastParagraph ])

const numberedList = new ListNode([ firstFormat, lastFormat ], true)
const bulletedList = new ListNode([ firstFormat, lastFormat ], false)

const beforeBold = new TextNode("I am a ");
const bold = new TextNode("bold");
const afterBold = new TextNode(" word.");
const boldChapter = new ChapterNode([new ParagraphNode(0, new FormatNode("", [ beforeBold, new FormatNode("*", [ bold ]), afterBold ]))])

test("Insert a block", () => {
    expect(paragraphChapter.withBlockInserted(firstParagraph, new RuleNode(), true)?.toBookdown()).toBe(`-\n\n${firstText}\n\n${lastText}`)
    expect(paragraphChapter.withBlockInserted(firstParagraph, new RuleNode(), false)?.toBookdown()).toBe(`${firstText}\n\n-\n\n${lastText}`)
    expect(paragraphChapter.withBlockInserted(lastParagraph, new RuleNode(), false)?.toBookdown()).toBe(`${firstText}\n\n${lastText}\n\n-`)
})

test("Remove a block", () => {
    expect(paragraphChapter.withoutBlock(firstParagraph)?.toBookdown()).toBe(lastText)
})

test("Merge adjascent lists", () => {
    expect(new ChapterNode([ numberedList, bulletedList ]).withAdjacentListsMerged().toBookdown()).toBe(`1. ${firstText}\n2. ${lastText}\n\n* ${firstText}\n* ${lastText}`)
    expect(new ChapterNode([ numberedList, numberedList ]).withAdjacentListsMerged().toBookdown()).toBe(`1. ${firstText}\n2. ${lastText}\n3. ${firstText}\n4. ${lastText}`)
    expect(new ChapterNode([ bulletedList, bulletedList ]).withAdjacentListsMerged().toBookdown()).toBe(`* ${firstText}\n* ${lastText}\n* ${firstText}\n* ${lastText}`)
})

test("Format range", () => {
    // Bold part of a paragraph.
    expect(paragraphChapter.withRangeFormatted({ start: { node: firstTextNode, index: 6 }, end: { node: firstTextNode, index: 10 }}, "*")?.root.toBookdown())
        .toBe(`First *para*graph.\n\n${lastText}`)

    // Remove part of a paragraph.
    expect(paragraphChapter.withRangeFormatted({ start: { node: firstTextNode, index: 6 }, end: { node: firstTextNode, index: 10 }}, undefined)?.root.toBookdown())
        .toBe(`First graph.\n\n${lastText}`)

    // Unbold the bold part of a paragraph with the selection outside the bold.
    expect(boldChapter.withRangeFormatted({ start: { node: beforeBold, index: beforeBold.getLength() }, end: { node: afterBold, index: 0 }}, "")?.root.toBookdown())
        .toBe(`I am a bold word.`)

    // Unbold the bold part of a paragraph with the selection inside the bold.
    expect(boldChapter.withRangeFormatted({ start: { node: bold, index: 0 }, end: { node: bold, index: bold.getLength() }}, "")?.root.toBookdown())
        .toBe(`I am a bold word.`)

    // Expand the bold part of a paragraph.
    expect(boldChapter.withRangeFormatted({ start: { node: beforeBold, index: beforeBold.getLength() - 2 }, end: { node: afterBold, index: 0 }}, "*")?.root.toBookdown())
        .toBe(`I am *a bold* word.`)

    // Delete across a paragraph boundary.
    expect(paragraphChapter.withRangeFormatted({ start: { node: firstTextNode, index: 6 }, end: { node: lastTextNode, index: 4 }}, undefined)?.root.toBookdown())
        .toBe(`First \n\n paragraph.`)

    // Bold across a paragraph boundary.
    expect(paragraphChapter.withRangeFormatted({ start: { node: firstTextNode, index: 6 }, end: { node: lastTextNode, index: 4 }}, "*")?.root.toBookdown())
        .toBe(`First *paragraph.*\n\n*Last* paragraph.`)
})

test("Split selection", () => {
    const caret = { node: firstTextNode, index: 5 }
    const chapter = new ChapterNode([ firstParagraph ]);

    // Split a paragraph
    const split = chapter.withSelectionSplit({ start: caret, end: caret })
    expect(split?.root.toBookdown()).toBe("First\n\n paragraph.")
    expect(split?.range.start.node.toBookdown()).toBe(" paragraph.")
    expect(split?.range.start.index).toBe(0)

    // Delete a selection and then split
    const selectSplit = chapter.withSelectionSplit({ start: { node: firstTextNode, index: 5 }, end: { node: firstTextNode, index: 10 } })
    expect(selectSplit?.root.toBookdown()).toBe("First\n\ngraph.")

    // Split at the beginning
    const startCaret = { node: firstTextNode, index: 0 }
    const startSplit = chapter.withSelectionSplit({ start: startCaret, end: startCaret })
    expect(startSplit?.root.toBookdown()).toBe(`\n\n${firstText}`)
    
    // Split at the end
    const endCaret = { node: firstTextNode, index: 16 }
    const endSplit = chapter.withSelectionSplit({ start: endCaret, end: endCaret })
    expect(endSplit?.root.toBookdown()).toBe(`${firstText}\n\n`)
    
})

test("Without atom", () => {
    const chapterAtomEnd = new ChapterNode([ new ParagraphNode(0, new FormatNode("", [ firstFormat, footnote ]))])
    expect(chapterAtomEnd.withoutAtom(footnote)?.root.toBookdown())
        .toBe(`${firstText}`)

    const chapterAtomBegin = new ChapterNode([ new ParagraphNode(0, new FormatNode("", [ footnote, firstFormat ]))])
    expect(chapterAtomBegin.withoutAtom(footnote)?.root.toBookdown())
        .toBe(`${firstText}`)

    const chapterAtomMiddle = new ChapterNode([ new ParagraphNode(0, new FormatNode("", [ firstFormat, footnote, lastFormat ]))])
    expect(chapterAtomMiddle.withoutAtom(footnote)?.root.toBookdown())
        .toBe(`${firstText}${lastText}`)
})

test("Insert atom", () => {
    const endOfFirst = { node: firstTextNode, index: firstTextNode.getLength()}

    // Insert empty footnote
    expect(paragraphChapter.withSegmentAtSelection({ start: endOfFirst, end: endOfFirst }, text => new FootnoteNode(new FormatNode("", [new TextNode(text)])))?.root.toBookdown())
        .toBe(`${firstText}{}\n\n${lastText}`)

    // Convert selection to footnote
    expect(paragraphChapter.withSegmentAtSelection({ start: { node: firstTextNode, index: 6}, end: { node: firstTextNode, index: 15} }, text => new FootnoteNode(new FormatNode("", [new TextNode(text)])))?.root.toBookdown())
        .toBe(`First {paragraph}.\n\n${lastText}`)

})

test("Convert range to list", () => {

    // Convert a single paragraph to a list item.
    expect(paragraphChapter.withRangeAsList({ start: { node: firstTextNode, index: 0}, end: { node: firstTextNode, index: 0 }}, false)?.toBookdown())
        .toBe(`* ${firstText}\n\n${lastText}`)

    // Convert two paragraphs to a single list
    expect(paragraphChapter.withRangeAsList({ start: { node: firstTextNode, index: 0}, end: { node: lastTextNode, index: 0 }}, true)?.toBookdown())
        .toBe(`1. ${firstText}\n2. ${lastText}`)

    // Convert paragraphs that span a blocks boundary to separate lists.
    expect(new ChapterNode([ firstParagraph, new CalloutNode([ lastParagraph ]) ]).withRangeAsList({ start: { node: firstTextNode, index: 0 }, end: { node: lastTextNode, index: 0 }}, true)?.toBookdown())
        .toBe(`1. ${firstText}\n\n=\n1. ${lastText}\n=`)

    // Convert non-paragraphs to lists
    expect(new ChapterNode([ numberedList ]).withRangeAsList({ start: { node: firstTextNode, index: 0 }, end: { node: lastTextNode, index: 0 }}, true))
    .toBeUndefined()

})