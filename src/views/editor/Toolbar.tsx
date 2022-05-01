import React, { ReactNode, RefObject } from "react";
import { ChapterNode } from "../../models/ChapterNode";
import { CaretState } from "./ChapterEditor";
import { Command, commands } from "./Commands";

import Text from "../svg/text.svg";
import Hash from "../svg/hash.svg";
import Level from "../svg/level.svg";
import Block from "../svg/block.svg";
import List from "../svg/list.svg";
import LinkIcon from "../svg/link.svg";
import Code from "../svg/code.svg";

import { TextNode } from "../../models/TextNode";
import { AtomNode } from "../../models/AtomNode";

import { LinkNode } from "../../models/LinkNode";
import { LabelNode } from "../../models/LabelNode";
import { InlineCodeNode } from "../../models/InlineCodeNode";
import { CitationsNode } from "../../models/CitationsNode";
import { DefinitionNode } from "../../models/DefinitionNode";
import { CodeNode } from "../../models/CodeNode";
import { CalloutNode } from "../../models/CalloutNode";

import LabelEditor from "./LabelEditor";
import InlineCodeEditor from "./InlineCodeEditor";
import CitationsEditor from "./CitationsEditor";
import LinkEditor from "./LinkEditor";
import DefinitionEditor from "./DefinitionEditor";
import CaptionedCodeEditor from "./CaptionedCodeEditor";
import CalloutEditor from "./CalloutEditor";
import { QuoteNode } from "../../models/QuoteNode";
import QuoteEditor from "./QuoteEditor";
import { EmbedNode } from "../../models/EmbedNode";
import EmbedEditor from "./EmbedEditor";

const keyLabels: {[key: string]: string} = {
    "Digit0": "0",
    "Digit1": "1",
    "Digit2": "2",
    "Digit3": "3",
    "ArrowDown": "↓",
    "ArrowUp": "↑",
    "ArrowLeft": "←",
    "ArrowRight": "→",
    "Backspace": "\u232B",
}

const categoryOrder: {[key:string] : number } = {
    "navigation": 1,
    "selection": 2,
    "text": 3,
    "annotation": 4,
    "paragraph": 5,
    "level": 6,
    "list": 7,
    "table": 8,
    "block": 9,
}

const categoryIcons: {[key:string]: Function} = {
    "text": Text,
    "annotation": Hash,
    "level": Level,
    "block": Block,
    "list": List
}

const Toolbar = (props: { 
    focused: boolean,
    chapter: ChapterNode, 
    context: CaretState, 
    executor: (command: Command, key: string) => void
    },
) => {

    function getShortcutDescription(command: Command) {
        const macOS = navigator.platform.indexOf('Mac') > -1;
        const controlSymbol = macOS ? "\u2318" : "Ctrl+";
        const altSymbol = macOS ? "\u2325" : "Alt+";
        const key = command.key ? command.key : command.code ? command.code : "any";
        const keyLabel = (key in keyLabels ? keyLabels[key] : key).toLocaleUpperCase();
        return `${command.control ? controlSymbol : ""}${command.alt ? altSymbol : ""}${command.shift ? "\u21E7" : ""}${keyLabel}`;
    }

    // Filter the commands by those interactive with a mouse and active.
    const visible = commands.filter(command => command.visible.call(undefined, props.context));

    // Extract the active categories and sort them
    const categories = 
        Array.from(new Set(commands.map(command => command.category)))
            .sort((a, b) => a in categoryOrder && b in categoryOrder ? categoryOrder[a] - categoryOrder[b] : 0);

    // Make a list for each category of commands
    const commandsByCategory: {[key: string]: Command[]} = {};
    categories.forEach(cat => {
        commandsByCategory[cat] = visible.filter(command => command.category === cat);
    });

    const caretNode = props.context.start.node;

    const metaNode = 
        caretNode instanceof AtomNode ? caretNode :
        caretNode instanceof TextNode ? caretNode.getParent() : 
        undefined;

    const calloutNode = caretNode.getClosestParentMatching(p => p instanceof CalloutNode) as CalloutNode;
    const quoteNode = caretNode.getClosestParentMatching(p => p instanceof QuoteNode) as QuoteNode;
    const embedNode = caretNode.getClosestParentMatching(p => p instanceof EmbedNode) as EmbedNode;

    function wrapIcon(icon: Function) {
        return <span className='bookish-chapter-editor-toolbar-icon'>{icon.call(undefined)}</span>;
    }

    function handleKeyDown(event: React.KeyboardEvent) {
        // Return focus to th editor if someone presses an unhandled enter
        if(event.key === "Enter") {
            const editor = document.querySelector(".bookish-chapter-editor");
            if(editor instanceof HTMLElement) {
                event.stopPropagation();
                editor.focus();
            }
            return true;
        }
    }

    // Render command categories.
    return <div className="bookish-chapter-editor-toolbar" onKeyDown={handleKeyDown}>
        {
            categories.map(cat => 
                commandsByCategory[cat].length === 0 ?
                    null :
                    <ToolbarGroup row={categoryOrder[cat] > 7} key={cat} icon={ cat in categoryIcons ? wrapIcon(categoryIcons[cat]) : cat.charAt(0).toUpperCase() + cat.slice(1) }>
                        {
                            commandsByCategory[cat]
                                // Convert commands into buttons
                                .map((command, index) =>
                                    <button 
                                        key={index}
                                        disabled={!command.active.call(undefined, props.context)}
                                        title={command.description + " " + getShortcutDescription(command)}
                                        onClick={() => props.executor.call(undefined, command, "")}
                                    >
                                        { command.icon ? command.icon.call(undefined) : command.label ? command.label : command.description }
                                    </button>
                                )
                        }
                    </ToolbarGroup>
            )
        }
        { metaNode instanceof LinkNode ? <ToolbarGroup row={true} icon={wrapIcon(LinkIcon)}><LinkEditor link={metaNode}/></ToolbarGroup> : null }
        { metaNode instanceof LabelNode ? <ToolbarGroup row={true} icon="Label"><LabelEditor label={metaNode}/></ToolbarGroup> : null }
        { metaNode instanceof InlineCodeNode ? <ToolbarGroup row={true} icon={wrapIcon(Code)}><InlineCodeEditor code={metaNode}/></ToolbarGroup> : null }
        { metaNode instanceof CitationsNode ? <ToolbarGroup row={true} icon="Citations"><CitationsEditor citations={metaNode}/></ToolbarGroup> : null }
        { metaNode instanceof DefinitionNode ? <ToolbarGroup row={true} icon="Glossary"><DefinitionEditor definition={metaNode}/></ToolbarGroup> : null }
        { metaNode instanceof CodeNode ? <ToolbarGroup row={true} icon={wrapIcon(Code)}><CaptionedCodeEditor code={props.context.start.node.getParent() as CodeNode}/></ToolbarGroup> : null }
        { calloutNode ? <ToolbarGroup row={true} icon="Callout"><CalloutEditor callout={calloutNode} /></ToolbarGroup> : null }
        { quoteNode ? <ToolbarGroup row={true} icon="Quote"><QuoteEditor quote={quoteNode} /></ToolbarGroup> : null }
        { embedNode ? <ToolbarGroup row={true} icon="Image/Video"><EmbedEditor embed={embedNode} /></ToolbarGroup> : null }

    </div>

}

const ToolbarGroup = (props: {
    row: boolean,
    icon: ReactNode,
    children: React.ReactNode
}) => {

    return <>
        { props.row ? <hr/> : null }
        <div className="bookish-chapter-editor-toolbar-group">
            <span className="bookish-chapter-editor-toolbar-icon">{props.icon}</span>
            { props.children }
        </div>
    </>

}

export default Toolbar;