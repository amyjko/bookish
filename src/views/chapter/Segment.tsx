import { CitationsNode } from "../../models/chapter/CitationsNode";
import { CommentNode } from "../../models/chapter/CommentNode";
import { DefinitionNode } from "../../models/chapter/DefinitionNode";
import { FootnoteNode } from "../../models/chapter/FootnoteNode";
import { FormatNodeSegmentType } from "../../models/chapter/FormatNode";
import { InlineCodeNode } from "../../models/chapter/InlineCodeNode";
import { LabelNode } from "../../models/chapter/LabelNode";
import { LinkNode } from "../../models/chapter/LinkNode";
import { TextNode } from "../../models/chapter/TextNode";

import Citations from "./Citations";
import Definition from "./Definition";
import Footnote from "./Footnote";
import InlineCode from "./InlineCode";
import Label from "./Label";
import Link from "./Link";
import Comment from "./Comment";
import Text from "./Text";

const Segment = (props: { node: FormatNodeSegmentType }) => {

    const { node } = props;

    return node instanceof TextNode ? <Text node={node} /> :
        node instanceof InlineCodeNode ? <InlineCode node={node} /> :
        node instanceof LinkNode ? <Link node={node} /> :
        node instanceof CitationsNode ? <Citations node={node} /> :
        node instanceof DefinitionNode ? <Definition node={node} /> :
        node instanceof FootnoteNode ? <Footnote node={node} /> :
        node instanceof LabelNode ? <Label node={node} /> :
        node instanceof CommentNode ? <Comment node={node} /> :
        <span className="bookish-error">Unknown segment type {node.constructor.name}</span>

};

export default Segment;