<script lang="ts">
    import { isEditable } from "./Contexts";

    let editable = isEditable();
</script>

{#if editable }
    <div class="bookish-instructions"><slot></slot></div>
{/if}