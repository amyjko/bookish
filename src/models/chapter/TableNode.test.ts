import { test, expect } from 'vitest'

import { FormatNode } from "./FormatNode"
import { TextNode } from "./TextNode"
import { TableNode } from "./TableNode"

const tl = new FormatNode("", [ new TextNode("tl") ])
const tr = new FormatNode("", [ new TextNode("tr") ])
const bl = new FormatNode("", [ new TextNode("bl") ])
const br = new FormatNode("", [ new TextNode("br") ])
const caption = new FormatNode("", [ new TextNode("hi") ])
const table = new TableNode(
    [
        [ tl, tr ],
        [ bl, br ],
    ],
    "|", caption
)

test("Replace", () => {
    expect(table.withChildReplaced(tl, new FormatNode("", [ new TextNode("new")]))?.toBookdown())
        .toBe(",new|tr\n,bl|br\nhi")

    expect(table.withChildReplaced(caption, new FormatNode("", [ new TextNode("bye")]))?.toBookdown())
        .toBe(",tl|tr\n,bl|br\nbye")
})

test("Insert", () => {
    expect(table.withNewRow(0)?.toBookdown())
        .toBe(",|\n,tl|tr\n,bl|br\nhi")
    expect(table.withNewColumn(0)?.toBookdown())
        .toBe(",|tl|tr\n,|bl|br\nhi")
})

test("Delete", () => {
    expect(table.withoutRow(0)?.toBookdown())
        .toBe(",bl|br\nhi")
    expect(table.withoutColumn(0)?.toBookdown())
        .toBe(",tr\n,br\nhi")
})