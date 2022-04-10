import { BlocksNode } from "./BlocksNode";
import { CalloutNode } from "./CalloutNode";
import { ChapterNode } from "./ChapterNode";
import { QuoteNode } from "./QuoteNode";


export type BlockParentNode = ChapterNode | CalloutNode | QuoteNode | BlocksNode;
