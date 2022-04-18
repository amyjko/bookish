import React from "react";
import { ChapterNode } from "../../models/ChapterNode";
import { CaretContext } from "./ChapterEditor";
import { Command, commands } from "./Commands";

import Text from "../svg/text.svg";
import Hash from "../svg/hash.svg";
import Level from "../svg/level.svg";
import Block from "../svg/block.svg";
import List from "../svg/list.svg";

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
    chapter: ChapterNode, 
    context: CaretContext, 
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
    const active = commands.filter(command => command.mouse && command.active.call(undefined, props.context));

    // Extract the active categories and sort them
    const categories = 
        Array.from(new Set(commands.map(command => command.category)))
            .sort((a, b) => a in categoryOrder && b in categoryOrder ? categoryOrder[a] - categoryOrder[b] : 0);

    // Make a list for each category of commands
    const commandsByCategory: {[key: string]: Command[]} = {};
    categories.forEach(cat => {
        commandsByCategory[cat] = active.filter(command => command.category === cat);
    });

    // Render command categories.
    return <div className="bookish-chapter-editor-toolbar">
        {
            categories.map((cat, index) => 
                commandsByCategory[cat].length === 0 ?
                    null :
                    <span key={cat}>
                        <span>{ cat in categoryIcons ? categoryIcons[cat].call(undefined) : cat }&nbsp;&nbsp;</span>
                        <span>
                        {
                            commandsByCategory[cat]
                                // Convert commands into buttons
                                .map((command, index) =>
                                    <button 
                                        key={index}
                                        title={command.description + " " + getShortcutDescription(command)}
                                        onClick={() => props.executor.call(undefined, command, "")}
                                    >
                                        { command.icon ? command.icon.call(undefined) : command.label ? command.label : command.description }
                                    </button>
                                )
                        }
                        </span>
                        &nbsp;&nbsp;&nbsp;&nbsp;
                    </span>
            )
        }
    </div>

}

export default Toolbar;