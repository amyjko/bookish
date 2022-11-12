<script lang="ts">
    import ToolbarIcon from "./ToolbarIcon.svelte";

    export let linebreak: boolean = false;
    export let icon: string;

</script>

{#if linebreak }<br/>{/if}
<span class="bookish-editor-toolbar-group">
    <ToolbarIcon name={icon}/><slot></slot>
</span>