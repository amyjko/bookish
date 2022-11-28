<script lang="ts">
    import TextEditor from "./TextEditor.svelte";

    export let url: string;
    export let validator: (text: string) => undefined | string;
    export let edit: (newURL: string) => string | undefined;
</script>

<TextEditor
    placeholder="url" 
    startText={url} 
    label="URL editor"
    valid={ url => validator(url) }
    save={ url => edit(url) }
/>