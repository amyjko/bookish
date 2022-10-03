import { BlockNode } from "../../models/chapter/BlockNode";
import { CalloutNode } from "../../models/chapter/CalloutNode";
import { CodeNode } from "../../models/chapter/CodeNode";
import { EmbedNode } from "../../models/chapter/EmbedNode";
import { ErrorNode } from "../../models/chapter/ErrorNode";
import { ListNode } from "../../models/chapter/ListNode";
import { ParagraphNode } from "../../models/chapter/ParagraphNode";
import { QuoteNode } from "../../models/chapter/QuoteNode";
import { RuleNode } from "../../models/chapter/RuleNode";
import { TableNode } from "../../models/chapter/TableNode";
import Callout from "./Callout";
import CaptionedCode from "./CaptionedCode";
import Embed from "./Embed";
import ErrorMessage from "./ErrorMessage";
import List from "./List";
import Paragraph from "./Paragraph";
import Quote from "./Quote";
import Rule from "./Rule";
import Table from "./Table";

const Block = (props: { node: BlockNode, key?: string }) => {

    const { node, key } = props;

    return node instanceof ParagraphNode ? <Paragraph node={node} key={key} /> :
        node instanceof ListNode ? <List node={node} key={key}  /> :
        node instanceof EmbedNode ? <Embed node={node} key={key}  /> :
        node instanceof CalloutNode ? <Callout node={node} key={key}  /> :
        node instanceof QuoteNode ? <Quote node={node} key={key}  /> :
        node instanceof CodeNode ? <CaptionedCode node={node} key={key}  /> :
        node instanceof ErrorNode ? <ErrorMessage node={node} key={key}  /> :
        node instanceof RuleNode ? <Rule node={node} key={key}  /> :
        node instanceof TableNode ? <Table node={node} key={key}  /> :
        <p>Unknown node type</p>

};

export default Block;