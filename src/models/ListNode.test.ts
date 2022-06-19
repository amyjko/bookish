import { ChapterNode } from "./ChapterNode";
import { FormatNode } from "./FormatNode";
import { ListNode } from "./ListNode";
import { TextNode } from "./TextNode";

const oneText = new TextNode("one")
const oneFormat = new FormatNode("", [ oneText] )
const twoText = new TextNode("two")
const twoFormat = new FormatNode("", [ twoText ])
const threeText = new TextNode("three")
const threeFormat = new FormatNode("", [ threeText ])
const fourText = new TextNode("four")
const fourFormat = new FormatNode("", [ fourText ])
const fiveText = new TextNode("five")
const fiveFormat = new FormatNode("", [ fiveText ])
const list = new ListNode([ oneFormat, new ListNode([ twoFormat, threeFormat, fourFormat], false), fiveFormat ], false)

test("Indent", () => {
    expect(list.withItemIndented(oneFormat)?.toBookdown()).toBe(`** one\n** two\n** three\n** four\n* five`)
    expect(list.withItemIndented(twoFormat)?.toBookdown()).toBe(`* one\n*** two\n** three\n** four\n* five`)
    expect(list.withItemIndented(fiveFormat)?.toBookdown()).toBe(`* one\n** two\n** three\n** four\n** five`)
})

test("Unindent", () => {
    expect(list.withItemUnindented(twoFormat)?.toBookdown()).toBe(`* one\n* two\n** three\n** four\n* five`)
    expect(list.withItemUnindented(oneFormat)?.toBookdown()).toBeUndefined()
    expect(list.withItemUnindented(threeFormat)?.toBookdown()).toBe(`* one\n** two\n* three\n** four\n* five`)
})
