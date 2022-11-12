<script lang="ts">
    import type ReferenceNode from "$lib/models/chapter/ReferenceNode";
    import TextEditor from "../editor/TextEditor.svelte";
    import { getContext } from "svelte";
    import { EDITABLE, getEdition } from "./Contexts";

    export let node: ReferenceNode;
    
    let editable = getContext<boolean>(EDITABLE);
    let edition = getEdition();

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
    <span data-nodeid={node.nodeID} class="bookish-reference-text">
        <!-- Authors -->
        {#if editable }
            <em>
                <TextEditor
                    text={node.authors} 
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
        <br/>({#if editable }
                <TextEditor
                    text={node.year} 
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
        {#if editable }
            <br/><TextEditor
                text={node.title} 
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
        {#if editable }
            <br/><em>
                <TextEditor
                    text={node.source}
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
        {#if editable }
            <br/><TextEditor
                text={node.summary} 
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
    </span>
{/if}