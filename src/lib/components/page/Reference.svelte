<script lang="ts">
    import type ReferenceNode from "$lib/models/chapter/ReferenceNode";
    import { afterUpdate } from "svelte";
    import ConfirmButton from "../editor/ConfirmButton.svelte";
    import TextEditor from "../editor/TextEditor.svelte";
    import { getEdition, isEditable } from "./Contexts";

    export let node: ReferenceNode;
    
    let editable = isEditable();
    let edition = getEdition();

    let reference: HTMLElement | null = null;
    let editing = false;
    let entered = false;

    afterUpdate(() => {
        if(editing && entered && reference) {
            entered = false;
            reference.querySelector("input")?.focus();
        }
    });

    function startEditing() {
        editing = true; 
        entered = true;
    }

    function stopEditing() {
        editing = false;
    }

</script>

<!-- If a short version was requested, try to abbreviate the authors. -->
{#if node.short }
    {@const authorList = node.authors.split(",") }
    {@const authors =   authorList.length === 1 ?   authorList[0] :
                        authorList.length === 2 ?   authorList[0].trim() + " & " + authorList[1].trim() :
                                                    authorList[0].trim() + ", et al."}
    <span data-nodeid={node.nodeID} class="bookish-reference-text">
        {authors}
        ({node.year}).
        {#if node.url === null }
            {node.title}
        {:else}
            <a href={node.url} target={"_blank"}>{node.title}</a>
        {/if}
        {node.title.charAt(node.title.length - 1) === "?" ? "" : "."}
        <em>{node.source}</em>
    </span>
{:else if !editable || !editing }
<!-- If not editable, just render the reference. -->
    <span 
        data-nodeid={node.nodeID} 
        class="bookish-reference-text"
        tabIndex=0
        on:click|stopPropagation={() => { if(editable) startEditing(); }}
        on:keydown={event => { if(event.key === "Enter" || event.key === "Space") startEditing(); }}
    >
        {#if node.authors }{node.authors}{:else}<em>Authors</em>{/if} {#if node.year }({node.year}){:else}<em>Year</em>{/if}. {#if node.url === null || node.url.length === 0}{#if node.title}{node.title}{:else}<em>Title</em>{/if}{:else}<a href={node.url} target={"_blank"}>{#if node.title}{node.title}{:else}<em>Title</em>{/if}</a>{/if}.<em> {#if node.source}{node.source}{:else}Source{/if}</em>.
        {#if node.summary}<div class="bookish-reference-summary">{node.summary}</div>{/if}
    </span>
    {#if editable}
        <ConfirmButton
            commandLabel="x"
            confirmLabel="Confirm"
            command={() => $edition.removeReference(node.citationID)}
        />
    {/if}
{:else}
    <!-- If editable, place in rows to make room for text editors to not have to wrap. -->
    <table class="bookish-table" bind:this={reference}>
        <tbody>
            <!-- Authors -->
            <tr>
                <td>Authors</td>
                <td>
                    <TextEditor
                        startText={node.authors} 
                        label={'Author list editor.'}
                        placeholder="Authors"
                        valid={ text => {
                            if(text.length === 0) return "Authors can't be empty.";
                        }}
                        save={text => $edition.editReference(node.withAuthors(text))}
                        width={60}
                    />
                </td>
            </tr>
            <!-- Year -->
            <tr>
                <td>Year</td>
                <td>
                    <TextEditor
                        startText={node.year} 
                        label={'Year editor.'} 
                        placeholder="Year"
                        valid={ text => {
                            if(text.length === 0) return "Year can't be empty";
                            if(!/1?[0-9)[0-9]{2}/.test(text)) return "Not a valid year"
                        }}
                        save={text => $edition.editReference(node.withYear(text))}
                    />
                </td>
            </tr>
            <!-- Title -->
            <tr>
                <td>Title</td>
                <td>
                    <TextEditor
                        startText={node.title} 
                        label={'Title editor.'} 
                        placeholder="Title"
                        valid={ text => {
                            if(text.length === 0) return "Title can't be empty.";
                        }}
                        save={text => $edition.editReference(node.withTitle(text))}
                        width={60}
                    />
                </td>
            </tr>
            <!-- Source -->
            <tr>
                <td>Source</td>
                <td>
                    <em>
                        <TextEditor
                            startText={node.source}
                            label={'Source editor.'} 
                            placeholder="Source"
                            valid={ text => {
                                if(text.length === 0) return "Source can't be empty";
                            }}
                            save={text => $edition.editReference(node.withSource(text))}
                            width={60}
                        />
                    </em>
                </td>
            </tr>
            <!-- URL -->
            <tr>
                <td>URL</td>
                <td>
                    <TextEditor
                        startText={node.url} 
                        label={'URL editor.'} 
                        placeholder="URL"
                        valid={ () => undefined }
                        save={text => 
                            $edition.editReference(node.withURL(text))}
                        width={60}
                    />
                </td>
            </tr>
            <tr>
                <td>Summary</td>
                <td>
                    <TextEditor
                        startText={node.summary} 
                        label={'Summary editor.'} 
                        placeholder="Summary"
                        valid={ () => undefined }
                        save={text => 
                            $edition.editReference(node.withSummary(text))}
                        width={60}
                    />
                </td>
            </tr>
            <tr>
                <td colspan=2>
                    <button 
                        on:click|stopPropagation={() => stopEditing()}
                        on:keydown={event => { if(editing && (event.key === "Enter" || event.key === " ")) { stopEditing(); event.stopPropagation(); }}}
                    >
                        done
                    </button>
                </td>
        </tbody>
    </table>
{/if}

<style>

    .bookish-reference-text {
        line-height: var(--bookish-paragraph-line-height-tight);
    }

    .bookish-reference-text .bookish-reference-summary {
        font-size: var(--bookish-small-font-size);
        padding-left: var(--bookish-block-padding);
        border-left: 1px solid var(--bookish-border-color-light);
        margin-top: var(--bookish-block-padding);
        font-style: italic;
    }

</style>