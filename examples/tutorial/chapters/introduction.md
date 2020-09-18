Welcome to the Peruse example book! This introduction contains all of the features supported by the platform, and explanation of how they work.

Let's go through each of the basic formatting features of book chapters. To begin, let's start with headers, all of which can be indicated by starting a line with the pound symbol #. For example, here's some code that starts a top-level header:

`
# This is a header
`

That will be formatted like this:

# This is a header

You can put as many as three consecutive pounds for subheaders and sub-subheaders. Even though the web supports more than that, I didn't include more than that because readers tend to get overwhelmed by complex document structures. Here are the three different size:

`
# Header
## Subheader
### Sub-subheader
`

# Header
## _Sub_header
### _Subsub_header

There are many ways to format text.

It can be _italic_ by wrapping text with the \_ symbol:

`
It can be _italic_ by wrapping text with the \_ symbol:
`

It can be *bold* by wrapping text with the \* symbol.

`
It can be *bold* by wrapping text with the \* symbol.
`

It can be both *_bold and italic_* by wrapping words with both \* and \_.

`
It can be both *_bold and italic_* by wrapping words with both.
`

It can be in bullet form by starting a line with \*:

`
* Item _1_
* Item _2_
* Item _3_
`

* Item _1_
* Item _2_
* Item _3_

It can be in numbered form by staring a line with a number followed by a period:
`
1. Item 1
2. Item 2
3. Item 3
`
1. Item 1
2. Item 2
3. Item 3

The numbers don't have to be in a particular order, they just have to be a number.

`
3. Item 1
22. Item 2
111. Item 3
`
3. Item 1
22. Item 2
111. Item 3

You can include [links to content|http://amyjko.com] like this:

`
You can include [links to content|http://amyjko.com].
`

The \| separates the link text from the URL. All links will open new windows.

You can add links to chapters by just using the chapter identifier given in the book's specification. For example, here's a link to [Chapter 1|chapter1].

`
Visit [Chapter 1|chapter1].
`

Chapter links won't open in new windows.

If you link to a chapter that doesn't exist, bad things happen:

`
Visit [a chapter that doesn't exist|doesnotexist].
`

Visit [a chapter that doesn't exist|doesnotexist].

You can include captioned images like the one at the top of this chapter by using this format, indicating the caption, description of the image, credit for the image, and the image file name:

`
|chapter1.jpg|A photograph of Boomy seeking nuzzles|A caption with a reference <ref1>.|Amy J. Ko|
`

|chapter1.jpg|A photograph of Boomy seeking nuzzles|A caption with a reference <ref1>.|Amy J. Ko|

If you cite something that doesn't appear in your book specification's reference list, you'll get an error like this: <thisisanunknowncitation>.

You can also include YouTube videos by using the same syntax as above, but just including a YouTube video in the URL instead.

`
|https://www.youtube.com/embed/Gc5ReRHqlkk|A video Amy made with her daughter back when Angry Birds was popular.|A YouTube video showing Angry Birds enacted in real life.|Amy J. Ko
`

|https://www.youtube.com/embed/Gc5ReRHqlkk|A video Amy made with her daughter back when Angry Birds was popular.|A YouTube video showing Angry Birds enacted in real life.|Amy J. Ko

You can include code by wrapping any text with a backtick \`:

`
This is Python code
but it will not compile
invalid syntax
`

(Yes, that was a haiku.)

You can also include code `inline` by wrapping things in \`in backticks\`.

You can include comments in text by starting a line with the \% symbol:

`
% This is a comment.
`

% This is a comment.

Text in comments won't be visible in the chapter. This is helpful for keeping notes about improvements to make, or rationale for a section of a chapter.

To use any of the special symbols above, place a \\ a before it to mean that you mean the symbol, and not it's special meaning.

`
     Any space at the beginning or end of a
   line, or before or after a line, will be 
            ignored.   
`

     Any space at the beginning or end of a line, or before or after a line, will be ignored.   

The same is true of extra lines before and after paragraphs.

It's also possible to include quotes:

`
"
This is my quote
" Me
`

"
This is my quote
" Me

If you start a line with any number of hyphens...

`
---
`

---

You'll get a horizontal rule.

If you use plain "quotes" in a sentence, it will replace them with 'smart' quotes. Quotes that follow a space get a left curly quote; quotes that come before a space get a right curly quote. And single quotes that appear anywhere other than after a space get a right curly single quote for apostrophes. Isn't that cool?

Quotes of things "should be curly".
This should be independent of "where periods are."
This also works for 'single quotes'.
Also independent of 'where periods are.' And what follows. 
This shouldn't break for contractions, including 'those that appear'n in quotes a'nat' or sentences with 'multiple apostrophes'.
This shouldn't break for "things followed by citations"<ref1>.
This shouldn't "break for commas," either.

You can also cite things <ref1,ref2> or just cite one thing <ref1>.

When clicking on something in the index, the index word should be highlighted no matter how many times the index appears in a span of text and regardless of whether the *index word* is formatted.