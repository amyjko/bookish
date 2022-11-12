<script lang="ts">
    import { getContext } from "svelte";
    import { EDITABLE } from "./Symbols";

    let editable = getContext<boolean>(EDITABLE);
</script>

{#if editable }
    <div class="bookish-instructions"><slot></slot></div>
{/if}