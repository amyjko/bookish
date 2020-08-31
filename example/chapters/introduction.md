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
This is _italic_ text.
`

It can be *bold* by wrapping text with the \* symbol.

`
This is *bold* text.
`

It can be both ^bold and italic^ by wrapping words with \^.

`
This is ^bold and italic^ text.
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
2. Item 2
1. Item 3
`
3. Item 1
2. Item 2
1. Item 3

You can include [links to content|http://amyjko.com] like this:

`
You can include [links to content|http://amyjko.com].
`

The \| separates the link text from the URL.

You can include captioned images like the one at the top of this chapter by using this format, indicating the caption, description of the image, credit for the image, and the image file name:

`
![Boomy welcomes you to the example chapter!][A photograph of Boomy seeking nuzzles.][Amy J. Ko](/images/chapter1.jpg)
`

You can also include YouTube videos by using the same syntax as above, but just including a YouTube video in the URL instead.

`
|https://www.youtube.com/embed/Gc5ReRHqlkk|A video Amy made with her daughter back when Angry Birds was popular.|A YouTube video showing Angry Birds enacted in real life.|Amy J. Ko
`

|https://www.youtube.com/embed/Gc5ReRHqlkk|A video Amy made with her daughter back when Angry Birds was popular.|A YouTube video showing Angry Birds enacted in real life.|Amy J. Ko

You can include code by wrapping any text with a backtick \`:

`
This is Python code
but it will not compile, silly
it has syntax errors
`

(Yes, that was a haiku.)

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

But, if you include 
_consecutive_ lines without a 
space between them, 
rather than creating a paragraph,
the lines will be treated as a single
paragraph with embedded line breaks.