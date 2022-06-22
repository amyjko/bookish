import { CalloutNode } from "./CalloutNode";
import { ChapterNode } from "./ChapterNode";
import { FootnoteNode } from "./FootnoteNode";
import { FormatNode } from "./FormatNode";
import { ListNode } from "./ListNode";
import { ParagraphNode } from "./ParagraphNode";
import { QuoteNode } from "./QuoteNode";
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
const bulletedList = new ListNode([ firstFormat.copy(), lastFormat.copy() ], false)

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
    expect(paragraphChapter.withoutRange({ start: { node: firstTextNode, index: 6 }, end: { node: lastTextNode, index: 5 }}, undefined)?.root.toBookdown())
        .toBe(`First paragraph.`)

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

test("Convert paragraphs to lists", () => {

    // Convert a single paragraph to a list item.
    expect(paragraphChapter.withParagraphsAsLists({ start: { node: firstTextNode, index: 0}, end: { node: firstTextNode, index: 0 }}, false)?.toBookdown())
        .toBe(`* ${firstText}\n\n${lastText}`)

    // Convert two paragraphs to a single list
    expect(paragraphChapter.withParagraphsAsLists({ start: { node: firstTextNode, index: 0}, end: { node: lastTextNode, index: 0 }}, true)?.toBookdown())
        .toBe(`1. ${firstText}\n2. ${lastText}`)

    // Convert paragraphs that span a blocks boundary to separate lists.
    expect(new ChapterNode([ firstParagraph, new CalloutNode([ lastParagraph ]) ]).withParagraphsAsLists({ start: { node: firstTextNode, index: 0 }, end: { node: lastTextNode, index: 0 }}, true)?.toBookdown())
        .toBe(`1. ${firstText}\n\n=\n1. ${lastText}\n=`)

    // Convert non-paragraphs to lists
    expect(new ChapterNode([ numberedList ]).withParagraphsAsLists({ start: { node: firstTextNode, index: 0 }, end: { node: lastTextNode, index: 0 }}, true))
    .toBeUndefined()

})

test("Convert lists to paragraphs", () => {

    // Convert lists to paragraphs
    expect(new ChapterNode([ numberedList ]).withListsAsParagraphs({ start: { node: firstTextNode, index: 0 }, end: { node: firstTextNode, index: 5 }})?.toBookdown())
        .toBe(`${firstText}\n\n${lastText}`)

    // Convert both items to paragraphs.
    expect(new ChapterNode([ numberedList ]).withListsAsParagraphs({ start: { node: firstTextNode, index: 0 }, end: { node: lastTextNode, index: 5 }})?.toBookdown())
        .toBe(`${firstText}\n\n${lastText}`)

    // Convert non-list to paragraphs.
    expect(paragraphChapter.withListsAsParagraphs({ start: { node: firstTextNode, index: 0 }, end: { node: lastTextNode, index: 5 }})?.toBookdown())
        .toBeUndefined()

    // Convert two contiguous lists to paragraphs.
    expect(new ChapterNode([ numberedList, bulletedList ]).withListsAsParagraphs({ start: { node: firstTextNode, index: 0 }, end: { node: bulletedList.getFirstItem()?.getFirstTextNode() as TextNode, index: 0 }})?.toBookdown())
        .toBe(`${firstText}\n\n${lastText}\n\n${firstText}\n\n${lastText}`)

    // Convert two non-contiguous lists to paragraphs.
    expect(new ChapterNode([ numberedList, new ParagraphNode(0, new FormatNode("", [ new TextNode("Intruder!") ])), bulletedList ]).withListsAsParagraphs({ start: { node: firstTextNode, index: 0 }, end: { node: bulletedList.getFirstItem()?.getFirstTextNode() as TextNode, index: 0 }})?.toBookdown())
        .toBe(`${firstText}\n\n${lastText}\n\nIntruder!\n\n${firstText}\n\n${lastText}`)

    // Convert various subparts of a nested list into paragraphs.
    const oneText = new TextNode("one");
    const twoText = new TextNode("two");
    const threeText = new TextNode("three");
    const fourText = new TextNode("four");
    const list = new ListNode([ new FormatNode("", [ oneText] ), new ListNode([ new FormatNode("", [ twoText ]), new FormatNode("", [ threeText ])], true), new FormatNode("", [ fourText ])], true)

    expect(new ChapterNode([ list ] ).withListsAsParagraphs({ start: { node: oneText, index: 0 }, end: { node: fourText, index: 0 }})?.toBookdown())
        .toBe(`${oneText.getText()}\n\n${twoText.getText()}\n\n${threeText.getText()}\n\n${fourText.getText()}`)

    expect(new ChapterNode([ list ] ).withListsAsParagraphs({ start: { node: oneText, index: 0 }, end: { node: twoText, index: 0 }})?.toBookdown())
        .toBe(`${oneText.getText()}\n\n${twoText.getText()}\n\n${threeText.getText()}\n\n${fourText.getText()}`)

    expect(new ChapterNode([ list ] ).withListsAsParagraphs({ start: { node: twoText, index: 0 }, end: { node: threeText, index: 0 }})?.toBookdown())
        .toBe(`${oneText.getText()}\n\n${twoText.getText()}\n\n${threeText.getText()}\n\n${fourText.getText()}`)

})

test("Indent/unindent list items", () => {

    expect(new ChapterNode([ numberedList ]).withListsIndented(
        { start: { node: firstTextNode, index: 0 }, end: { node: firstTextNode, index: 0 }},
        true
    )?.toBookdown()).toBe("1.. First paragraph.\n2. Last paragraph.")

    const indented = new ChapterNode([ numberedList ]).withListsIndented(
        { start: { node: firstTextNode, index: 0 }, end: { node: lastTextNode, index: 0 }},
        true
    )
    expect(indented?.toBookdown()).toBe("1.. First paragraph.\n2.. Last paragraph.")

    expect(indented?.withListsIndented(
        { start: { node: firstTextNode, index: 0 }, end: { node: lastTextNode, index: 0 }},
        false
    )?.toBookdown()).toBe("1. First paragraph.\n2. Last paragraph.")

})

test("Style lists", () => {

    expect(new ChapterNode([ numberedList ]).withListAsStyle(numberedList, false)?.toBookdown())
        .toBe(`* ${firstText}\n* ${lastText}`)

})

test("Backspace/delete", () => {

    const chapter = new ChapterNode([ firstParagraph, lastParagraph ]);

    expect(chapter.withoutAdjacentContent({ node: lastTextNode, index: 1}, true)?.root.toBookdown())
        .toBe(`${firstText}\n\nLst paragraph.`)
    expect(chapter.withoutAdjacentContent({ node: lastTextNode, index: 1}, false)?.root.toBookdown())
        .toBe(`${firstText}\n\nast paragraph.`)
    expect(chapter.withoutAdjacentContent({ node: lastTextNode, index: 0}, false)?.root.toBookdown())
        .toBe(`${firstText}${lastText}`)
    expect(chapter.withoutAdjacentContent({ node: firstTextNode, index: firstTextNode.getLength()}, true)?.root.toBookdown())
        .toBe(`${firstText}${lastText}`)
    expect(chapter.withoutAdjacentContent({ node: firstTextNode, index: 0}, false)?.root.toBookdown())
        .toBeUndefined()

    const beforeText = new TextNode("Before");
    const beforeParagraph = new ParagraphNode(0, new FormatNode("", [ beforeText ]));
    const afterText = new TextNode("After");
    const afterParagraph = new ParagraphNode(0, new FormatNode("", [ afterText ]));
    const listChapter = new ChapterNode([ beforeParagraph, numberedList, afterParagraph ]);

    // Do nothing when backspacing at the beginning of a list.
    expect(listChapter.withoutAdjacentContent({ node: firstTextNode, index: 0 }, false)?.root.toBookdown())
        .toBeUndefined()
    // Delete a character in a list
    expect(listChapter.withoutAdjacentContent({ node: firstTextNode, index: 0 }, true)?.root.toBookdown())
        .toBe(`Before\n\n1. irst paragraph.\n2. ${lastText}\n\nAfter`)
    // Can't forward delete into a list
    expect(listChapter.withoutAdjacentContent({ node: beforeText, index: beforeText.getLength() }, true)?.root.toBookdown())
        .toBe(`Before${firstText}\n\n1. ${lastText}\n\nAfter`)
    // Backspace a paragraph into the last list item
    expect(listChapter.withoutAdjacentContent({ node: afterText, index: 0 }, false)?.root.toBookdown())
        .toBe(`Before\n\n1. ${firstText}\n2. ${lastText}After`)

    // Backspace over a block
    const quoteChapter = new ChapterNode([ new QuoteNode([]), firstParagraph ]);
    expect(quoteChapter.withoutAdjacentContent({ node: firstTextNode, index: 0}, false)?.root.toBookdown())
        .toBe(`${firstText}`)

})