import { test, expect } from 'vitest'

import { CalloutNode } from "./CalloutNode";
import { ChapterNode } from "./ChapterNode";
import { CodeNode } from "./CodeNode";
import { EmbedNode } from "./EmbedNode";
import { FootnoteNode } from "./FootnoteNode";
import { FormatNode } from "./FormatNode";
import { ListNode } from "./ListNode";
import { ParagraphNode } from "./ParagraphNode";
import { QuoteNode } from "./QuoteNode";
import { RuleNode } from "./RuleNode";
import { TableNode } from "./TableNode";
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
    expect(paragraphChapter.withBlockInserted(firstParagraph, new RuleNode(), true)?.toBookdown()).toBe(`\n\n-\n\n${firstText}\n\n${lastText}`)
    expect(paragraphChapter.withBlockInserted(firstParagraph, new RuleNode(), false)?.toBookdown()).toBe(`${firstText}\n\n-\n\n${lastText}`)
    expect(paragraphChapter.withBlockInserted(lastParagraph, new RuleNode(), false)?.toBookdown()).toBe(`${firstText}\n\n${lastText}\n\n-\n\n`)
})

test("Remove a block", () => {
    expect(paragraphChapter.withoutBlock(firstParagraph)?.toBookdown()).toBe(lastText)
})

test("Merge adjascent lists", () => {
    expect(new ChapterNode([ numberedList, bulletedList ]).toBookdown()).toBe(`\n\n1. ${firstText}\n2. ${lastText}\n\n\n\n* ${firstText}\n* ${lastText}\n\n`)
    expect(new ChapterNode([ numberedList, numberedList ]).toBookdown()).toBe(`\n\n1. ${firstText}\n2. ${lastText}\n3. ${firstText}\n4. ${lastText}\n\n`)
    expect(new ChapterNode([ bulletedList, bulletedList ]).toBookdown()).toBe(`\n\n* ${firstText}\n* ${lastText}\n* ${firstText}\n* ${lastText}\n\n`)
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
    expect(paragraphChapter.withoutRange({ start: { node: firstTextNode, index: 6 }, end: { node: lastTextNode, index: 5 }})?.root.toBookdown())
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
        .toBe(`\n\n* ${firstText}\n\n${lastText}`)

    // Convert two paragraphs to a single list
    expect(paragraphChapter.withParagraphsAsLists({ start: { node: firstTextNode, index: 0}, end: { node: lastTextNode, index: 0 }}, true)?.toBookdown())
        .toBe(`\n\n1. ${firstText}\n2. ${lastText}\n\n`)

    // Convert paragraphs that span a blocks boundary to separate lists.
    expect(new ChapterNode([ firstParagraph, new CalloutNode([ lastParagraph ]) ]).withParagraphsAsLists({ start: { node: firstTextNode, index: 0 }, end: { node: lastTextNode, index: 0 }}, true)?.toBookdown())
        .toBe(`\n\n1. ${firstText}\n\n\n\n=\n\n\n1. ${lastText}\n\n\n=\n\n`)

    // Convert non-paragraphs to lists
    expect(new ChapterNode([ numberedList ]).withParagraphsAsLists({ start: { node: firstTextNode, index: 0 }, end: { node: lastTextNode, index: 0 }}, true))
        .toBeUndefined()

})

test("Convert lists to paragraphs", () => {

    // Convert lists to paragraphs
    expect(new ChapterNode([ numberedList ]).withListsAsParagraphs({ start: { node: firstTextNode, index: 0 }, end: { node: firstTextNode, index: 5 }})?.toBookdown())
        .toBe(`\n\n${firstText}\n\n${lastText}\n\n`)

    // Convert both items to paragraphs.
    expect(new ChapterNode([ numberedList ]).withListsAsParagraphs({ start: { node: firstTextNode, index: 0 }, end: { node: lastTextNode, index: 5 }})?.toBookdown())
        .toBe(`\n\n${firstText}\n\n${lastText}\n\n`)

    // Convert non-list to paragraphs.
    expect(paragraphChapter.withListsAsParagraphs({ start: { node: firstTextNode, index: 0 }, end: { node: lastTextNode, index: 5 }})?.toBookdown())
        .toBeUndefined()

    // Convert two contiguous lists to paragraphs.
    expect(new ChapterNode([ numberedList, bulletedList ]).withListsAsParagraphs({ start: { node: firstTextNode, index: 0 }, end: { node: bulletedList.getFirstItem()?.getFirstTextNode() as TextNode, index: 0 }})?.toBookdown())
        .toBe(`\n\n${firstText}\n\n${lastText}\n\n\n\n${firstText}\n\n${lastText}\n\n`)

    // Convert two non-contiguous lists to paragraphs.
    expect(new ChapterNode([ numberedList, new ParagraphNode(0, new FormatNode("", [ new TextNode("Intruder!") ])), bulletedList ]).withListsAsParagraphs({ start: { node: firstTextNode, index: 0 }, end: { node: bulletedList.getFirstItem()?.getFirstTextNode() as TextNode, index: 0 }})?.toBookdown())
        .toBe(`\n\n${firstText}\n\n${lastText}\n\nIntruder!\n\n${firstText}\n\n${lastText}\n\n`)

    // Convert various subparts of a nested list into paragraphs.
    const oneText = new TextNode("one");
    const twoText = new TextNode("two");
    const threeText = new TextNode("three");
    const fourText = new TextNode("four");
    const list = new ListNode([ new FormatNode("", [ oneText] ), new ListNode([ new FormatNode("", [ twoText ]), new FormatNode("", [ threeText ])], true), new FormatNode("", [ fourText ])], true)

    expect(new ChapterNode([ list ] ).withListsAsParagraphs({ start: { node: oneText, index: 0 }, end: { node: fourText, index: 0 }})?.toBookdown())
        .toBe(`\n\n${oneText.getText()}\n\n${twoText.getText()}\n\n${threeText.getText()}\n\n${fourText.getText()}\n\n`)

    expect(new ChapterNode([ list ] ).withListsAsParagraphs({ start: { node: oneText, index: 0 }, end: { node: twoText, index: 0 }})?.toBookdown())
        .toBe(`\n\n${oneText.getText()}\n\n${twoText.getText()}\n\n${threeText.getText()}\n\n${fourText.getText()}\n\n`)

    expect(new ChapterNode([ list ] ).withListsAsParagraphs({ start: { node: twoText, index: 0 }, end: { node: threeText, index: 0 }})?.toBookdown())
        .toBe(`\n\n${oneText.getText()}\n\n${twoText.getText()}\n\n${threeText.getText()}\n\n${fourText.getText()}\n\n`)

})

test("Indent/unindent list items", () => {

    expect(new ChapterNode([ numberedList ]).withListsIndented(
        { start: { node: firstTextNode, index: 0 }, end: { node: firstTextNode, index: 0 }},
        true
    )?.toBookdown()).toBe("\n\n1.. First paragraph.\n2. Last paragraph.\n\n")

    const indented = new ChapterNode([ numberedList ]).withListsIndented(
        { start: { node: firstTextNode, index: 0 }, end: { node: lastTextNode, index: 0 }},
        true
    )
    expect(indented?.toBookdown()).toBe("\n\n1.. First paragraph.\n2.. Last paragraph.\n\n")

    expect(indented?.withListsIndented(
        { start: { node: firstTextNode, index: 0 }, end: { node: lastTextNode, index: 0 }},
        false
    )?.toBookdown()).toBe("\n\n1. First paragraph.\n2. Last paragraph.\n\n")

})

test("Style lists", () => {

    expect(new ChapterNode([ numberedList ]).withListAsStyle(numberedList, false)?.toBookdown())
        .toBe(`\n\n* ${firstText}\n* ${lastText}\n\n`)

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
        .toBe(`Before\n\n1. ${firstText}\n2. ${lastText}After\n\n`)

    // Select two list items for deletion.
    expect(listChapter.withoutRange({ start: { node: firstTextNode, index: 0}, end: { node: lastTextNode, index: 5 }})?.root.toBookdown())
        .toBe(`Before\n\n1. paragraph.\n\nAfter`);

    // Backspace over a block
    const quoteChapter = new ChapterNode([ new QuoteNode([]), firstParagraph ]);
    expect(quoteChapter.withoutAdjacentContent({ node: firstTextNode, index: 0}, false)?.root.toBookdown())
        .toBe(`\n\n${firstText}`)

})

test("Copy/paste", () => {
    // Build a document with everything.
    const sentence1 = new TextNode("Hello, I am a sentence.")
    const paragraph1 = new ParagraphNode(0, new FormatNode("", [ sentence1 ]))

    const sentence2 = new TextNode("Hello, I am another sentence.")
    const boldSentence3 = new TextNode(" Can you believe my size?")
    const paragraph2 = new ParagraphNode(0, new FormatNode("", [ sentence2, new FormatNode("*", [ boldSentence3 ]) ]))

    const sentence3 = new TextNode("Lonely last.")
    const paragraph3 = new ParagraphNode(0, new FormatNode("", [ sentence3 ]))

    const imageCaption = new TextNode("no image")
    const imageCredit = new TextNode("Amy")
    const image = new EmbedNode("nope", "nothing", new FormatNode("", [ imageCaption ]), new FormatNode("", [ imageCredit ]))

    const js = new TextNode("let a = 1;");
    const code = new CodeNode(js, "js", "|", new FormatNode("", [ new TextNode("assignment")]))

    const item1 = new TextNode("one")
    const item1a = new TextNode("one a")
    const item2 = new TextNode("two")
    const item3 = new TextNode("three")
    const list = new ListNode([ new FormatNode("", [ item1 ]), new ListNode([ new FormatNode("", [ item1a ]) ], true), new FormatNode("", [ item2 ]), new FormatNode("", [ item3 ]) ], true)

    const afterList = new TextNode("Post-list");
    const afterListParagraph = new ParagraphNode(0, new FormatNode("", [ afterList ]));

    const cellr1c1 = new TextNode("a");
    const cellr1c2 = new TextNode("b");
    const cellr1c3 = new TextNode("c");
    const cellr2c1 = new TextNode("d");
    const cellr2c2 = new TextNode("e");
    const cellr2c3 = new TextNode("f");
    const cellr3c1 = new TextNode("g");
    const cellr3c2 = new TextNode("h");
    const cellr3c3 = new TextNode("i");
    const table = new TableNode([
        [ new FormatNode("", [ cellr1c1 ]), new FormatNode("", [ cellr1c2 ]), new FormatNode("", [ cellr1c3 ])],
        [ new FormatNode("", [ cellr2c1 ]), new FormatNode("", [ cellr2c2 ]), new FormatNode("", [ cellr2c3 ])],
        [ new FormatNode("", [ cellr3c1 ]), new FormatNode("", [ cellr3c2 ]), new FormatNode("", [ cellr3c3 ])]
    ])

    const calloutOne = new TextNode("one")
    const calloutTwo = new TextNode("two")
    const calloutThree = new TextNode("three")
    const callout = new CalloutNode([ new ParagraphNode(0, new FormatNode("", [ calloutOne ])), new ParagraphNode(0, new FormatNode("", [ calloutTwo ])), new ParagraphNode(0, new FormatNode("", [ calloutThree ]))])

    const quoteOne = new TextNode("I'm tired")
    const quoteCredit = new TextNode("Boomy")
    const quote = new QuoteNode([ new ParagraphNode(0, new FormatNode("", [ quoteOne ]))], new FormatNode("", [ quoteCredit ]))

    const chapter = new ChapterNode([ paragraph1, paragraph2, paragraph3, image, code, list, afterListParagraph, table, callout, quote ]);

    const partialSegment = chapter.copyRange({ start: { node: sentence1, index: 12}, end: { node: sentence1, index: 22 }})
    const reversedPartialSegment = chapter.copyRange({ start: { node: sentence1, index: 22}, end: { node: sentence1, index: 12 }})
    const consecutivePartialParagraphs = chapter.copyRange({ start: { node: sentence1, index: 12}, end: { node: sentence2, index: 5 }})
    const threeParagraphs = chapter.copyRange({ start: { node: sentence1, index: sentence1.getLength() - 1 }, end: { node: sentence3, index: 6 }})

    // Paragraphs
    expect(partialSegment?.toBookdown())
        .toBe("a sentence")
    expect(reversedPartialSegment?.toBookdown())
        .toBe("a sentence")
    expect(consecutivePartialParagraphs?.toBookdown())
        .toBe("a sentence.\n\nHello")
    expect(threeParagraphs?.toBookdown())
        .toBe(`.\n\n${sentence2.toBookdown()}*${boldSentence3.toBookdown()}*\n\nLonely`)

    const partialImageCaption = chapter.copyRange({ start: { node: imageCaption, index: 3}, end: { node: imageCaption, index: 8 }})
    const partialImageCredit = chapter.copyRange({ start: { node: imageCredit, index: 2}, end: { node: imageCredit, index: 3 }})
    const imageCaptionAndCredit = chapter.copyRange({ start: { node: imageCaption, index: 3}, end: { node: imageCredit, index: 1 }})
    const paragraphAndImage = chapter.copyRange({ start: { node: sentence3, index: 7}, end: { node: imageCaption, index: 2 }})
    
    // Images
    expect(partialImageCaption?.toBookdown())
        .toBe(`image`)
    expect(partialImageCredit?.toBookdown())
        .toBe(`y`)
    expect(imageCaptionAndCredit?.toBookdown())
        .toBe(`|nope|nothing|no |my|`)
    expect(paragraphAndImage?.toBookdown())
        .toBe(`last.\n\n|nope|nothing|no|Amy|\n\n`)

    const imageAndCode = chapter.copyRange({ start: { node: imageCredit, index: 0}, end: { node: js, index: 3 }})
    
    // Code
    expect(imageAndCode?.toBookdown())
        .toBe(`\n\n|nope|nothing|no image|Amy|\n\n\n\n\`js\nlet\n\`\n\n`)

    const partialList = chapter.copyRange({ start: { node: item1a, index: 4}, end: { node: item2, index: 1 }})
    const partialListAndParagraph = chapter.copyRange({ start: { node: item2, index: 0}, end: { node: afterList, index: 4 }})
    
    // Lists
    expect(partialList?.toBookdown())
        .toBe(`1.. a\n2. t`)
    expect(partialListAndParagraph?.toBookdown())
        .toBe(`\n\n1. two\n2. three\n\nPost`)

    // Tables
    const partialTable = chapter.copyRange({ start: { node: cellr2c2, index: 0 }, end: { node: cellr3c2, index: 1 }})
    const partialTableAndParagraph = chapter.copyRange({ start: { node: afterList, index: 0 }, end: { node: cellr1c2, index: 1 }})
    
    expect(partialTable?.toBookdown())
        .toBe(`,|e|f\n,g|h|\n`)
    expect(partialTableAndParagraph?.toBookdown())
        .toBe(`Post-list\n\n,a|b|\n\n\n`)

    // Callouts
    const partialCallout = chapter.copyRange({ start: { node: calloutOne, index: 0 }, end: { node: calloutTwo, index: 1 }})
    const partialTableAndCallout = chapter.copyRange({ start: { node: cellr3c3, index: 0 }, end: { node: calloutTwo, index: 3 }})

    expect(partialCallout?.toBookdown())
        .toBe(`=\none\n\nt\n=`)
    expect(partialTableAndCallout?.toBookdown())
        .toBe(`\n\n,||i\n\n\n\n\n=\none\n\ntwo\n=\n\n`)

    // Quote
    const partialCalloutAndQuote = chapter.copyRange({ start: { node: calloutThree, index: 0 }, end: { node: quoteOne, index: 9 }})

    expect(partialCalloutAndQuote?.toBookdown())
        .toBe(`\n\n=\nthree\n=\n\n\n\n"\nI'm tired\n"\n\n`)

})