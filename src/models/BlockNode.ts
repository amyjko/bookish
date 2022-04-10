import { CalloutNode } from "./CalloutNode";
import { CodeNode } from "./CodeNode";
import { EmbedNode } from "./EmbedNode";
import { ErrorNode } from "./ErrorNode";
import { ListNode } from "./ListNode";
import { ParagraphNode } from "./ParagraphNode";
import { QuoteNode } from "./QuoteNode";
import { RuleNode } from "./RuleNode";
import { TableNode } from "./TableNode";


export type BlockNode = RuleNode | EmbedNode | ListNode | CodeNode | QuoteNode | CalloutNode | TableNode | ParagraphNode | ErrorNode;
