<script lang="ts">
    import type ReferenceNode from "$lib/models/chapter/ReferenceNode";
    import Button from "../app/Button.svelte";
    import Table from "../app/Table.svelte";
    import ConfirmButton from "../editor/ConfirmButton.svelte";
    import TextEditor from "../editor/TextEditor.svelte";
    import { getEdition, isEditable } from "./Contexts";
    import Link from "../Link.svelte";

    export let node: ReferenceNode;
    
    let editable = isEditable();
    let edition = getEdition();

    let editing = false;

    function startEditing() {
        editing = true; 
    }

    function stopEditing() {
        editing = false;
    }

    function move(field: HTMLElement, direction: 1 | -1) {
        let fields = Array.from(document.querySelectorAll('input[type="text"]')) as HTMLElement[];
        let index = fields.indexOf(field);
        if(index >= 0) {
            const newInput = 
                direction < 0 && index > 0 ? fields[index - 1] :
                direction > 0 && index < fields.length - 1 ? fields[index + 1] :
                undefined;
            if(newInput)
                newInput.focus();
        }
    }

</script>

{#if editable && !node.short }
    <ConfirmButton
        tooltip="Delete this reference"
        commandLabel="x"
        confirmLabel="Confirm"
        command={() => $edition.removeReference(node.citationID)}
    />
    <Button tooltip="Finish editing this reference." command={() => editing ? stopEditing() : startEditing()}>{editing ? "Done" : "Edit"}</Button>
{/if}
<!-- If a short version was requested, try to abbreviate the authors. -->
{#if node.short }
    {@const authorList = node.authors.split(",") }
    {@const authors =   authorList.length === 1 ?   authorList[0] :
                        authorList.length === 2 ?   authorList[0].trim() + " & " + authorList[1].trim() :
                                                    authorList[0].trim() + ", et al."}
    <p data-nodeid={node.nodeID} class="reference">
        {authors}
        ({node.year}).
        {#if node.url === null }
            {node.title}
        {:else}
            <Link to={node.url}>{node.title}</Link>
        {/if}
        {node.title.charAt(node.title.length - 1) === "?" ? "" : "."}
        <em>{node.source}</em>
    </p>
{:else if !editable || !editing }
<!-- If not editable, just render the reference. -->
    <p 
        data-nodeid={node.nodeID} 
        class="reference"
    >
        {#if node.authors }{node.authors}{:else}<em>Authors</em>{/if} {#if node.year }({node.year}){:else}<em>Year</em>{/if}. {#if node.url === null || node.url.length === 0}{#if node.title}{node.title}{:else}<em>Title</em>{/if}{:else}<Link to={node.url}>{#if node.title}{node.title}{:else}<em>Title</em>{/if}</Link>{/if}.<em> {#if node.source}{node.source}{:else}Source{/if}</em>.
        {#if node.summary}<div class="summary">{node.summary}</div>{/if}
    </p>
{:else}
    <!-- If editable, place in rows to make room for text editors to not have to wrap. -->
    <Table>
        <!-- Authors -->
        <tr>
            <td width="25%">Authors</td>
            <td>
                <TextEditor
                    text={node.authors} 
                    label={'Author list editor.'}
                    placeholder="Authors"
                    valid={ text => {
                        if(text.length === 0) return "Authors can't be empty.";
                    }}
                    save={text => $edition.editReference(node.withAuthors(text))}
                    {move}
                />
            </td>
        </tr>
        <!-- Year -->
        <tr>
            <td>Year</td>
            <td>
                <TextEditor
                    text={node.year} 
                    label={'Year editor.'} 
                    placeholder="Year"
                    valid={ text => {
                        if(text.length === 0) return "Year can't be empty";
                        if(!/1?[0-9)[0-9]{2}/.test(text)) return "Not a valid year"
                    }}
                    save={text => $edition.editReference(node.withYear(text))}
                    {move}
                />
            </td>
        </tr>
        <!-- Title -->
        <tr>
            <td>Title</td>
            <td>
                <TextEditor
                    text={node.title} 
                    label={'Title editor.'} 
                    placeholder="Title"
                    valid={ text => {
                        if(text.length === 0) return "Title can't be empty.";
                    }}
                    save={text => $edition.editReference(node.withTitle(text))}
                    {move}
                />
            </td>
        </tr>
        <!-- Source -->
        <tr>
            <td>Source</td>
            <td>
                <em>
                    <TextEditor
                        text={node.source}
                        label={'Source editor.'} 
                        placeholder="Source"
                        valid={ text => {
                            if(text.length === 0) return "Source can't be empty";
                        }}
                        save={text => $edition.editReference(node.withSource(text))}
                        {move}
                    />
                </em>
            </td>
        </tr>
        <!-- URL -->
        <tr>
            <td>URL</td>
            <td>
                <TextEditor
                    text={node.url} 
                    label={'URL editor.'} 
                    placeholder="URL"
                    valid={ () => undefined }
                    save={text => 
                        $edition.editReference(node.withURL(text))}
                    {move}
                />
            </td>
        </tr>
        <tr>
            <td>Summary</td>
            <td>
                <TextEditor
                    text={node.summary} 
                    label={'Summary editor.'} 
                    placeholder="Summary"
                    valid={ () => undefined }
                    save={text => 
                        $edition.editReference(node.withSummary(text))}
                    {move}
                />
            </td>
        </tr>
    </Table>
{/if}

<style>

    .reference {
        line-height: var(--bookish-paragraph-line-height);
        margin-top: 0;
        margin-bottom: var(--bookish-header-spacing);
    }

    .reference .summary {
        font-size: var(--bookish-small-font-size);
        padding-left: var(--bookish-block-padding);
        border-left: 1px solid var(--bookish-border-color-light);
        margin-top: var(--bookish-block-padding);
        font-style: italic;
    }

	td:first-child {
		font-style: italic;
	}

</style>