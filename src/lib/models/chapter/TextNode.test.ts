import { test, expect } from 'vitest'

import TextNode from "./TextNode"

test("Insert character", () => {
    const text = new TextNode("Hello");
    expect(text.withCharacterAt("!", 5)?.toBookdown()).toBe("Hello!");
})