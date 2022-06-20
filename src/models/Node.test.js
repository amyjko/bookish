import { TextNode } from "./TextNode";
import { FormatNode } from "./FormatNode";

const textOne = new TextNode("one");
const textTwo = new TextNode("two");
const textThree = new TextNode("three");
const textFour = new TextNode("four");
const textFive = new TextNode("five");

const format = new FormatNode("", [ textOne, textTwo, new FormatNode("*", [ textThree, textFour ]), textFive ]);

test("Replace descendants", () => {

    expect(format.withNodeReplaced(textThree, new TextNode("hi"))?.toBookdown())
        .toBe("onetwo*hifour*five")

    expect(format.withNodeReplaced(textFive, new TextNode("yo"))?.toBookdown())
        .toBe("onetwo*threefour*yo")

})