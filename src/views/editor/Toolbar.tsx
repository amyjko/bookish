import React, { ReactNode, useRef } from "react";
import { CaretState } from "./BookishEditor";
import { Command, commands } from "./Commands";

import Text from "../svg/text.svg";
import Hash from "../svg/hash.svg";
import Level from "../svg/level.svg";
import Block from "../svg/block.svg";
import List from "../svg/list.svg";
import LinkIcon from "../svg/link.svg";
import Code from "../svg/code.svg";
import Scissors from "../svg/scissors.svg";
import Media from "../svg/media.svg";
import Quote from "../svg/quote.svg";

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
    "clipboard": 4, 
    "annotation": 5,
    "paragraph": 6,
    "level": 7,
    "list": 8,
    "table": 9,
    "block": 10,
}

const categoryIcons: {[key:string]: Function | string} = {
    "text": Text,
    "clipboard": Scissors,
    "annotation": Hash,
    "level": Level,
    "block": Block,
    "list": List,
    "table": "▦",
    "history": "\u2026"
}

export const Spacer = (props: {}) => {
    return <span style={{ display: "inline-block", width: "1em"}}></span>
}

const Toolbar = (props: { 
    context?: CaretState, 
    executor?: (command: Command, key: string) => void,
    visible?: boolean
    },
) => {

    const toolbarRef = useRef<HTMLDivElement>(null);

    function getShortcutDescription(command: Command) {
        const macOS = navigator.platform.indexOf('Mac') > -1;
        const controlSymbol = macOS ? "\u2318" : "Ctrl+";
        const altSymbol = macOS ? "\u2325" : "Alt+";
        const key = command.key ? (Array.isArray(command.key) ? command.key.join("/") : command.key) : command.code ? command.code : "any";
        const keyLabel = (key in keyLabels ? keyLabels[key] : key).toLocaleUpperCase();
        return `${command.control ? controlSymbol : ""}${command.alt ? altSymbol : ""}${command.shift ? "\u21E7" : ""}${keyLabel}`;
    }

    function wrapIcon(icon: Function | string) {
        return <span className='bookish-editor-toolbar-icon'>{icon instanceof Function ? icon.call(undefined) : icon}</span>;
    }

    const context = props.context;
    const executor = props.executor;
    const chapter = props.context?.root;

    if(chapter === undefined) return <></>;

    let categories = undefined;
    let commandsByCategory: {[key: string]: Command[]} = {};

    let metaNode = undefined;
    let calloutNode = undefined;
    let quoteNode = undefined;
    let embedNode = undefined;

    if(context !== undefined) {

        // Filter the commands by those interactive with a mouse and active.
        const visible = commands.filter(command => command.visible === true || (command.visible instanceof Function && command.visible.call(undefined, context)));

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
            caretNode instanceof TextNode ? caretNode.getParent(chapter) : 
            undefined;

        calloutNode = caretNode.getClosestParentMatching(chapter, p => p instanceof CalloutNode) as CalloutNode;
        quoteNode = caretNode.getClosestParentMatching(chapter, p => p instanceof QuoteNode) as QuoteNode;
        embedNode = caretNode.getClosestParentMatching(chapter, p => p instanceof EmbedNode) as EmbedNode;

    }

    function handleKeyPress(event: React.KeyboardEvent) {
        // Return focus to the editor if someone presses an unhandled enter
        if(event.key === "Enter" && toolbarRef.current) {
            const editor = toolbarRef.current.closest(".bookish-editor");
            if(editor instanceof HTMLElement) {
                event.stopPropagation();
                editor.focus();
            }
            return true;
        }
    }

    function handleMouse(event: React.MouseEvent) {
        // This prevents the body from taking focus.
        if(toolbarRef.current && props.visible === true) {
            event.stopPropagation();
            return false;
        }
    }

    const containsFocus = toolbarRef.current && toolbarRef.current.contains(document.activeElement);
    const isVisible = props.visible === true || props.visible === undefined || containsFocus;

    // Render command categories.
    return <div 
        className="bookish-editor-toolbar" 
        onKeyPress={handleKeyPress} 
        onMouseDown={handleMouse}
        onClick={handleMouse}
        style={{margin: isVisible ? "0" : "-20em"}} 
        ref={toolbarRef}
        >
        {
        context && categories && props.executor ?
            categories.map(cat => 
                commandsByCategory[cat].length === 0 ?
                    null :
                    <ToolbarGroup key={cat} break={false} icon={ cat in categoryIcons ? wrapIcon(categoryIcons[cat]) : cat.charAt(0).toUpperCase() + cat.slice(1) }>
                        {
                            commandsByCategory[cat]
                                // Convert commands into buttons
                                .map((command, index) =>
                                    <button 
                                        key={index}
                                        disabled={command.active === false || (command.active instanceof Function && command.active.call(undefined, context) === false)}
                                        title={command.description + " " + getShortcutDescription(command)}
                                        tabIndex={0}
                                        onClick={() => executor?.call(undefined, command, "")}
                                        onKeyPress={(event) => event.key === " " || event.key === "Enter" ? executor?.call(undefined, command, "") : undefined }
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
        { metaNode instanceof LabelNode ? <ToolbarGroup icon="•"><LabelEditor label={metaNode}/></ToolbarGroup> : null }
        { metaNode instanceof InlineCodeNode ? <ToolbarGroup icon={wrapIcon(Code)}><InlineCodeEditor code={metaNode}/></ToolbarGroup> : null }
        { metaNode instanceof CitationsNode ? <ToolbarGroup icon="a\u00b9"><CitationsEditor citations={metaNode}/></ToolbarGroup> : null }
        { metaNode instanceof DefinitionNode ? <ToolbarGroup icon="Aa"><DefinitionEditor definition={metaNode}/></ToolbarGroup> : null }
        { metaNode instanceof CodeNode && context ? <ToolbarGroup icon={wrapIcon(Code)}><CaptionedCodeEditor code={context.start.node.getParent(chapter) as CodeNode}/></ToolbarGroup> : null }
        { calloutNode ? <ToolbarGroup icon="🄰"><CalloutEditor callout={calloutNode} /></ToolbarGroup> : null }
        { quoteNode ? <ToolbarGroup icon={wrapIcon(Quote)}><QuoteEditor quote={quoteNode} /></ToolbarGroup> : null }
        { embedNode ? <ToolbarGroup break={true} icon={wrapIcon(Media)}><EmbedEditor embed={embedNode} /></ToolbarGroup> : null }
    </div>

}

const ToolbarGroup = (props: {
    icon: ReactNode,
    break?: boolean,
    children: React.ReactNode
}) => {

    return <>
        { props.break !== false ? <br/> : null }
        <span className="bookish-editor-toolbar-group">
            <span className="bookish-editor-toolbar-icon">{props.icon}</span>
            { props.children }
        </span>
    </>

}

export default Toolbar;