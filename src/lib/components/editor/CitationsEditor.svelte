<script lang="ts">
    import type CitationsNode from "$lib/models/chapter/CitationsNode";

    export let citations: CitationsNode;

    citations;

    // let book = getContext<Book>(BOOK);
    // let caret = getContext(CaretContext)(CARET);

    // function handleCitationsChange(newValue: MultiValue<{value: string, label: string}>) {

    //     let newCitations = newValue.map(val => val.value);
    //     caret?.edit(citations, citations.withMeta(newCitations));

    // }

</script>

<span>
    TBD
    <!-- TBD -->
    <!-- <Select 
        isMulti 
        class="bookish-editor-select"
        classNamePrefix="bookish-editor-select"
        placeholder="Choose one or more citations."
        value={ citations.getMeta().map(val => { return { value: val, label: val }; }) }
        options={Object.keys(book.getReferences()).sort().map(citationID => { return {value: citationID, label: citationID }; })} 
        onChange={handleCitationsChange}
    />
    {
        citations.getMeta().length === 0 ?
            <span className="bookish-editor-note">Choose at least one citation.</span> :
            null
    } -->
</span>