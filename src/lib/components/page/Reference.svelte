<svelte:options immutable={true} />

<script lang="ts">
    import type Reference from '$lib/models/book/Reference';
    import Button from '../app/Button.svelte';
    import Table from '../app/Table.svelte';
    import ConfirmButton from '../editor/ConfirmButton.svelte';
    import TextEditor from '../editor/TextEditor.svelte';
    import { getEdition, isEditable } from './Contexts';
    import Link from '../Link.svelte';

    export let reference: Reference;

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
        let fields = Array.from(
            document.querySelectorAll('input[type="text"]')
        ) as HTMLElement[];
        let index = fields.indexOf(field);
        if (index >= 0) {
            const newInput =
                direction < 0 && index > 0
                    ? fields[index - 1]
                    : direction > 0 && index < fields.length - 1
                    ? fields[index + 1]
                    : undefined;
            if (newInput) newInput.focus();
        }
    }
</script>

{#if editable && !reference.short}
    <ConfirmButton
        tooltip="Delete this reference"
        commandLabel="x"
        confirmLabel="Confirm"
        command={() =>
            $edition
                ? edition.set($edition.withoutReference(reference.citationID))
                : undefined}
    />
    <Button
        tooltip="Finish editing this reference."
        command={() => (editing ? stopEditing() : startEditing())}
        >{editing ? 'Done' : 'Edit'}</Button
    >
{/if}
<!-- If a short version was requested, try to abbreviate the authors. -->
{#if reference.short}
    {@const authorList = reference.authors.split(',')}
    {@const authors =
        authorList.length === 1
            ? authorList[0]
            : authorList.length === 2
            ? authorList[0].trim() + ' & ' + authorList[1].trim()
            : authorList[0].trim() + ', et al.'}
    <p class="reference">
        {authors}
        ({reference.year}).
        {#if reference.url === null}
            {reference.title}
        {:else}
            <Link to={reference.url}>{reference.title}</Link>
        {/if}
        {reference.title.charAt(reference.title.length - 1) === '?' ? '' : '.'}
        <em>{reference.source}</em>
    </p>
{:else if !editable || !editing}
    <!-- If not editable, just render the reference. -->
    <p class="reference">
        {#if reference.authors}{reference.authors}{:else}<em>Authors</em>{/if}
        {#if reference.year}({reference.year}){:else}<em>Year</em>{/if}. {#if reference.url === null || reference.url.length === 0}{#if reference.title}{reference.title}{:else}<em
                    >Title</em
                >{/if}{:else}<Link to={reference.url}
                >{#if reference.title}{reference.title}{:else}<em>Title</em
                    >{/if}</Link
            >{/if}.<em
            >&nbsp;{#if reference.source}{reference.source}{:else}Source{/if}</em
        >.
        {#if reference.summary}<div class="summary">{reference.summary}</div
            >{/if}
    </p>
{:else}
    <!-- If editable, place in rows to make room for text editors to not have to wrap. -->
    <Table>
        <!-- Authors -->
        <tr>
            <td width="25%">Authors</td>
            <td>
                <TextEditor
                    text={reference.authors}
                    label={'Author list editor.'}
                    placeholder="Authors"
                    valid={(text) => {
                        if (text.length === 0) return "Authors can't be empty.";
                    }}
                    save={(text) =>
                        $edition
                            ? edition.set(
                                  $edition.withEditedReference(
                                      reference.withAuthors(text)
                                  )
                              )
                            : undefined}
                    {move}
                />
            </td>
        </tr>
        <!-- Year -->
        <tr>
            <td>Year</td>
            <td>
                <TextEditor
                    text={reference.year}
                    label={'Year editor.'}
                    placeholder="Year"
                    valid={(text) => {
                        if (text.length === 0) return "Year can't be empty";
                        if (!/1?[0-9)[0-9]{2}/.test(text))
                            return 'Not a valid year';
                    }}
                    save={(text) =>
                        $edition
                            ? edition.set(
                                  $edition.withEditedReference(
                                      reference.withYear(text)
                                  )
                              )
                            : undefined}
                    {move}
                />
            </td>
        </tr>
        <!-- Title -->
        <tr>
            <td>Title</td>
            <td>
                <TextEditor
                    text={reference.title}
                    label={'Title editor.'}
                    placeholder="Title"
                    valid={(text) => {
                        if (text.length === 0) return "Title can't be empty.";
                    }}
                    save={(text) =>
                        $edition
                            ? edition.set(
                                  $edition.withEditedReference(
                                      reference.withTitle(text)
                                  )
                              )
                            : undefined}
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
                        text={reference.source}
                        label={'Source editor.'}
                        placeholder="Source"
                        valid={(text) => {
                            if (text.length === 0)
                                return "Source can't be empty";
                        }}
                        save={(text) =>
                            $edition
                                ? edition.set(
                                      $edition.withEditedReference(
                                          reference.withSource(text)
                                      )
                                  )
                                : undefined}
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
                    text={reference.url}
                    label={'URL editor.'}
                    placeholder="URL"
                    valid={() => undefined}
                    save={(text) =>
                        $edition
                            ? edition.set(
                                  $edition.withEditedReference(
                                      reference.withURL(text)
                                  )
                              )
                            : undefined}
                    {move}
                />
            </td>
        </tr>
        <tr>
            <td>Summary</td>
            <td>
                <TextEditor
                    text={reference.summary}
                    label={'Summary editor.'}
                    placeholder="Summary"
                    valid={() => undefined}
                    save={(text) =>
                        $edition
                            ? edition.set(
                                  $edition.withEditedReference(
                                      reference.withSummary(text)
                                  )
                              )
                            : undefined}
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
