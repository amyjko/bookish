<script lang="ts">
    import type ReferenceNode from "$lib/models/chapter/ReferenceNode";
    import { afterUpdate } from "svelte";
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
{:else}
    <!-- If editable, place in rows to make room for text editors to not have to wrap. -->
    <span 
        data-nodeid={node.nodeID} 
        class="bookish-reference-text"
        tabIndex=0
        on:click|stopPropagation={() => { if(editable && !editing) startEditing(); }}
        on:keydown={event => { if(editable && !editing && (event.key === "Enter" || event.key === " ")) { startEditing(); event.stopPropagation(); }}}
        bind:this={reference}
    >
        <!-- Authors -->
        {#if editable && editing }
            <em>
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
            </em>
        {:else}
            {#if node.authors }
                {node.authors}
            {:else}
                <em>Authors</em>
            {/if}
        {/if}
        <!-- Year -->
        <br/>({#if editable && editing }
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
            {:else}
                {#if node.year }{node.year}{:else}<em>Year</em>{/if}
            {/if}). 
        <!-- Title -->
        {#if editable && editing }
            <br/><TextEditor
                startText={node.title} 
                label={'Title editor.'} 
                placeholder="Title"
                valid={ text => {
                    if(text.length === 0) return "Title can't be empty.";
                }}
                save={text => $edition.editReference(node.withTitle(text))}
                width={60}
            />
        {:else}
            {#if node.url === null}
                {#if node.title}{node.title}{:else}<em>Title</em>{/if}
            {:else}
                <a href={node.url} target={"_blank"}>{#if node.title}{node.title}{:else}<em>Title</em>{/if}</a>
            {/if}
        {/if}. 
        <!-- Source -->
        {#if editable && editing }
            <br/><em>
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
        {:else}
            <em>{#if node.source}{node.source}{:else}Source{/if}</em>
        {/if}. 
        {#if editable && editing }
            <br/><TextEditor
                startText={node.summary} 
                label={'Summary editor.'} 
                placeholder="Summary"
                valid={ () => undefined }
                save={text => $edition.editReference(node.withSummary(text))}
                width={60}
            />
        {:else}
            {#if node.summary}
                <span class="bookish-reference-summary">{node.summary}</span>
            {/if}
        {/if}
        {#if editing }
            <br/><button 
                on:click|stopPropagation={() => stopEditing()}
                on:keydown={event => { if(editing && (event.key === "Enter" || event.key === " ")) { stopEditing(); event.stopPropagation(); }}}
                >done editing</button>
        {/if}
    </span>
{/if}

<style>

    .bookish-reference-text .bookish-reference-summary {
        font-size: var(--bookish-small-font-size);
        padding-left: var(--bookish-indent);
        display: inline-block;
        border-left: 1px solid var(--bookish-border-color-light);
        margin-top: 1em;
        font-style: italic;
    }

</style>