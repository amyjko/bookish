![Boomy welcomes you to the example chapter!][A photograph of Boomy seeking nuzzles.][Amy J. Ko](/images/chapter1.jpg)

Welcome to the Peruse example book! This introduction contains all of the features supported by peruse.

For example, you can create top level headers by starting a line with the pound symbol #:

# This is a header

Peruse doesn't support numbered headers or subheaders yet; we're going to keep it simple at first.

# Formatting text

There are many ways to format text.

It can be _italic_ by wrapping text with the \_ symbol.

It can be *bold* by wrapping text with the \* symbol.

It can be both *_bold and italic_* by wrapping it with both \*\_.

It can be in bullet form by starting a line with \*:

* Item 1
* Item 2
* Item 3

It can be in numbered form by staring a line with a number followed by a period:

1. Item 1
2. Item 2
3. Item 3

(The numbers don't have to be in a particular order, they just have to be a number).

You can include [links to content](https://amyjko.com).

You can include captioned images like the one at the top of this chapter by using this format, indicating the caption, description of the image, credit for the image, and the image file name:

`![Boomy welcomes you to the example chapter!][A photograph of Boomy seeking nuzzles.][Amy J. Ko](/images/chapter1.jpg)`

You can also include YouTube videos by using the same syntax as above, but just including a YouTube video in the URL instead.

`![Boomy welcomes you to the example chapter!][A photograph of Boomy seeking nuzzles.][Amy J. Ko](/images/chapter1.jpg)`

![A video Amy made with her daughter back when Angry Birds was popular.][A YouTube video showing Angry Birds enacted in real life.][Amy J. Ko](https://www.youtube.com/watch?v=Gc5ReRHqlkk)

You can include code by wrapping any text with a backtick \`:

`
This is Python code
but it will not compile, silly
it has syntax errors
`

(Yes, that was a haiku.)

You can include comments in text by starting a line with the \% symbol:

% This is a comment.

Text in comments won't be visible in the chapter. This is helpful for keeping notes about improvements to make, or rationale for a section of a chapter.

To use any of the special symbols above, place a \\ a before it to mean that you mean the symbol, and not it's special meaning.