import React, { ReactNode } from "react";
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
import Header from "../app/Header";

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
    chapter?: ChapterNode, 
    context?: CaretState, 
    executor?: (command: Command, key: string) => void
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

    function wrapIcon(icon: Function) {
        return <span className='bookish-chapter-editor-toolbar-icon'>{icon.call(undefined)}</span>;
    }

    const context = props.context;
    const executor = props.executor;

    let categories = undefined;
    let commandsByCategory: {[key: string]: Command[]} = {};

    let metaNode = undefined;
    let calloutNode = undefined;
    let quoteNode = undefined;
    let embedNode = undefined;

    if(context !== undefined) {

        // Filter the commands by those interactive with a mouse and active.
        const visible = commands.filter(command => command.visible.call(undefined, context));

        // Extract the active categories and sort them
        categories = 
            Array.from(new Set(commands.map(command => command.category)))
                .sort((a, b) => a in categoryOrder && b in categoryOrder ? categoryOrder[a] - categoryOrder[b] : 0);

        // Make a list for each category of commands
        commandsByCategory = {};
        categories.forEach(cat => {
            if(commandsByCategory)
                commandsByCategory[cat] = visible.filter(command => command.category === cat);
        });

        const caretNode = context.start.node;

        metaNode = 
            caretNode instanceof AtomNode ? caretNode :
            caretNode instanceof TextNode ? caretNode.getParent() : 
            undefined;

        calloutNode = caretNode.getClosestParentMatching(p => p instanceof CalloutNode) as CalloutNode;
        quoteNode = caretNode.getClosestParentMatching(p => p instanceof QuoteNode) as QuoteNode;
        embedNode = caretNode.getClosestParentMatching(p => p instanceof EmbedNode) as EmbedNode;

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
        <Header/>
        {
        context && categories && props.executor ?
            categories.map(cat => 
                commandsByCategory[cat].length === 0 ?
                    null :
                    <ToolbarGroup key={cat} icon={ cat in categoryIcons ? wrapIcon(categoryIcons[cat]) : cat.charAt(0).toUpperCase() + cat.slice(1) }>
                        {
                            commandsByCategory[cat]
                                // Convert commands into buttons
                                .map((command, index) =>
                                    <button 
                                        key={index}
                                        disabled={!command.active.call(undefined, context)}
                                        title={command.description + " " + getShortcutDescription(command)}
                                        onClick={() => executor?.call(undefined, command, "")}
                                    >
                                        { command.icon ? command.icon.call(undefined) : command.label ? command.label : command.description }
                                    </button>
                                )
                        }
                    </ToolbarGroup>
            )
            : null
        }
        { metaNode instanceof LinkNode ? <ToolbarGroup icon={wrapIcon(LinkIcon)}><LinkEditor link={metaNode}/></ToolbarGroup> : null }
        { metaNode instanceof LabelNode ? <ToolbarGroup icon="Label"><LabelEditor label={metaNode}/></ToolbarGroup> : null }
        { metaNode instanceof InlineCodeNode ? <ToolbarGroup icon={wrapIcon(Code)}><InlineCodeEditor code={metaNode}/></ToolbarGroup> : null }
        { metaNode instanceof CitationsNode ? <ToolbarGroup icon="Citations"><CitationsEditor citations={metaNode}/></ToolbarGroup> : null }
        { metaNode instanceof DefinitionNode ? <ToolbarGroup icon="Glossary"><DefinitionEditor definition={metaNode}/></ToolbarGroup> : null }
        { metaNode instanceof CodeNode && context ? <ToolbarGroup icon={wrapIcon(Code)}><CaptionedCodeEditor code={context.start.node.getParent() as CodeNode}/></ToolbarGroup> : null }
        { calloutNode ? <ToolbarGroup icon="Callout"><CalloutEditor callout={calloutNode} /></ToolbarGroup> : null }
        { quoteNode ? <ToolbarGroup icon="Quote"><QuoteEditor quote={quoteNode} /></ToolbarGroup> : null }
        { embedNode ? <ToolbarGroup icon="Image/Video"><EmbedEditor embed={embedNode} /></ToolbarGroup> : null }

    </div>

}

const ToolbarGroup = (props: {
    icon: ReactNode,
    children: React.ReactNode
}) => {

    return <>
        <span className="bookish-chapter-editor-toolbar-group">
            <span className="bookish-chapter-editor-toolbar-icon">{props.icon}</span>
            { props.children }
        </span>
    </>

}

export default Toolbar;