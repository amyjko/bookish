<svelte:options immutable={true} />

<script lang="ts">
    import Reference from '$lib/models/book/Reference';
    import Button from '../app/Button.svelte';
    import Table from '../app/Table.svelte';
    import ConfirmButton from '../editor/ConfirmButton.svelte';
    import TextEditor from '../editor/TextEditor.svelte';
    import { getEdition, isEditionEditable } from './Contexts';
    import Link from '../Link.svelte';
    import Note from '../editor/Note.svelte';

    export let reference: Reference;
    export let edit: boolean = false;

    let editable = isEditionEditable();
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
            document.querySelectorAll('input[type="text"]'),
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
{:else if editable && edit && editing}
    <!-- If editable, place in rows to make room for text editors to not have to wrap. -->
    <Table>
        <!-- CitationID -->
        <tr>
            <td width="25%">id <Note>determines order, a-z</Note></td>
            <td>
                <TextEditor
                    text={reference.citationID}
                    label={'reference ID'}
                    placeholder="reference ID"
                    saveOnExit
                    valid={(text) => {
                        if (text.length === 0)
                            return "reference ID can't be empty.";
                        if ($edition && text in $edition.references) {
                            const existing = $edition.references[text];
                            if (
                                existing instanceof Reference &&
                                !reference.equals(existing)
                            )
                                return 'ID already taken';
                        }
                    }}
                    save={(text) =>
                        $edition
                            ? edition.set(
                                  $edition.withEditedReferenceID(
                                      text,
                                      reference,
                                  ),
                              )
                            : undefined}
                    {move}
                />
            </td>
        </tr>
        <!-- Authors -->
        <tr>
            <td width="25%">authors</td>
            <td>
                <TextEditor
                    text={reference.authors}
                    label={'author list editor'}
                    placeholder="authors"
                    valid={(text) => {
                        if (text.length === 0) return "Authors can't be empty.";
                    }}
                    save={(text) =>
                        $edition
                            ? edition.set(
                                  $edition.withEditedReference(
                                      reference.withAuthors(text),
                                  ),
                              )
                            : undefined}
                    {move}
                />
            </td>
        </tr>
        <!-- Year -->
        <tr>
            <td>year</td>
            <td>
                <TextEditor
                    text={reference.year}
                    label={'year editor'}
                    placeholder="year"
                    valid={(text) => {
                        if (text.length === 0) return "Year can't be empty";
                        if (!/1?[0-9)[0-9]{2}/.test(text))
                            return 'Not a valid year';
                    }}
                    save={(text) =>
                        $edition
                            ? edition.set(
                                  $edition.withEditedReference(
                                      reference.withYear(text),
                                  ),
                              )
                            : undefined}
                    {move}
                />
            </td>
        </tr>
        <!-- Title -->
        <tr>
            <td>title</td>
            <td>
                <TextEditor
                    text={reference.title}
                    label={'title editor'}
                    placeholder="title"
                    valid={(text) => {
                        if (text.length === 0) return "Title can't be empty.";
                    }}
                    save={(text) =>
                        $edition
                            ? edition.set(
                                  $edition.withEditedReference(
                                      reference.withTitle(text),
                                  ),
                              )
                            : undefined}
                    {move}
                />
            </td>
        </tr>
        <!-- Source -->
        <tr>
            <td>source</td>
            <td>
                <em>
                    <TextEditor
                        text={reference.source}
                        label={'source editor'}
                        placeholder="source"
                        valid={(text) => {
                            if (text.length === 0)
                                return "Source can't be empty";
                        }}
                        save={(text) =>
                            $edition
                                ? edition.set(
                                      $edition.withEditedReference(
                                          reference.withSource(text),
                                      ),
                                  )
                                : undefined}
                        {move}
                    />
                </em>
            </td>
        </tr>
        <!-- URL -->
        <tr>
            <td>url</td>
            <td>
                <TextEditor
                    text={reference.url}
                    label={'url editor'}
                    placeholder="url"
                    valid={() => undefined}
                    save={(text) =>
                        $edition
                            ? edition.set(
                                  $edition.withEditedReference(
                                      reference.withURL(text),
                                  ),
                              )
                            : undefined}
                    {move}
                />
            </td>
        </tr>
        <tr>
            <td>summary</td>
            <td>
                <TextEditor
                    text={reference.summary}
                    label={'summary editor'}
                    placeholder="summary"
                    valid={() => undefined}
                    save={(text) =>
                        $edition
                            ? edition.set(
                                  $edition.withEditedReference(
                                      reference.withSummary(text),
                                  ),
                              )
                            : undefined}
                    {move}
                />
            </td>
        </tr>
    </Table>
{:else}
    <!-- Otherwise, just render the reference. -->
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
        {#if reference.summary}<aside class="summary">{reference.summary}</aside
            >{/if}
    </p>
{/if}
{#if edit && editable && !reference.short}
    <div class="controls">
        {#if editable}<Note>{reference.citationID}</Note>{/if}
        <ConfirmButton
            tooltip="delete reference {reference.title}"
            confirm="delete reference"
            command={() =>
                $edition
                    ? edition.set(
                          $edition.withoutReference(reference.citationID),
                      )
                    : undefined}>⨉</ConfirmButton
        >
        <Button
            tooltip="stop editing reference"
            command={() => (editing ? stopEditing() : startEditing())}
            >{editing ? 'done' : 'edit'}</Button
        >
    </div>
{/if}

<style>
    .reference {
        line-height: var(--bookish-paragraph-line-height-tight);
        margin-top: 0;
        margin-top: var(--bookish-block-padding);
    }

    p {
        margin-top: 0;
        margin-bottom: 0;
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

    td {
        line-height: 1;
    }

    .controls {
        margin-top: calc(var(--bookish-block-padding) / 2);
    }
</style>
