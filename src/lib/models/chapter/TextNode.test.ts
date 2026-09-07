import { test, expect } from 'vitest';

import TextNode from './TextNode';

test('Insert character', () => {
    const text = new TextNode('Hello');
    expect(text.withCharacterAt('!', 5)?.toBookdown()).toBe('Hello!');
});

test('escapes every occurrence of a markup character, not just the first', () => {
    expect(new TextNode('a < b < c').toHTML()).toBe('a &lt; b &lt; c');
});

test('escapes ampersands without escaping the entities it introduces', () => {
    expect(new TextNode('<').toHTML()).toBe('&lt;');
    expect(new TextNode('a & b').toHTML()).toBe('a &amp; b');
    expect(new TextNode('&lt;').toHTML()).toBe('&amp;lt;');
});
