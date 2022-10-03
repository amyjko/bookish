import { test, expect } from 'vitest'

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
const shortList = new ListNode([ oneFormat, twoFormat, threeFormat ], false)
const list = new ListNode([ oneFormat, new ListNode([ twoFormat, threeFormat, fourFormat], false), fiveFormat ], false)

test("Insert items", () => {
    expect(shortList.withItemAppended(fourFormat)?.toBookdown()).toBe(`* one\n* two\n* three\n* four`)
    expect(shortList.withItemPrepended(fourFormat)?.toBookdown()).toBe(`* four\n* one\n* two\n* three`)
    expect(shortList.withItemAt(fourFormat, 9)).toBeUndefined()
    expect(shortList.withItemAt(fourFormat, 1)?.toBookdown()).toBe(`* one\n* four\n* two\n* three`)
    expect(shortList.withItemAfter(fourFormat, oneFormat)?.toBookdown()).toBe(`* one\n* four\n* two\n* three`)
    expect(shortList.withItemBefore(fourFormat, twoFormat)?.toBookdown()).toBe(`* one\n* four\n* two\n* three`)
    expect(shortList.withListAppended(new ListNode([ fourFormat, fiveFormat ], true))?.toBookdown()).toBe(`* one\n* two\n* three\n* four\n* five`)
})

test("Remove items", () => {
    expect(shortList.withItemReplaced(1, fourFormat)?.toBookdown()).toBe(`* one\n* four\n* three`)
    expect(shortList.withoutItemAt(0)?.toBookdown()).toBe(`* two\n* three`)
})

test("Split", () => {
    expect(shortList.withItemSplit({ node: threeText, index: 2})?.toBookdown())
        .toBe("* one\n* two\n* th\n* ree")

})

test("Merge", () => {
    const merged = shortList.withItemMergedBackwards(1);
    expect(merged).not.toBeUndefined()
    if(merged !== undefined)
        expect(merged[0].toBookdown()).toBe("* onetwo\n* three")
})

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
