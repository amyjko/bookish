<script lang="ts">
    import EmbedNode from "$lib/models/chapter/EmbedNode";
    import Parser from "$lib/models/chapter/Parser";
    import { getContext } from "svelte";
    import type Edition from "$lib/models/book/Edition";
    import { EDITION } from "./Symbols";
    import type { Writable } from "svelte/store";

    export let embed: string | null;

    let edition = getContext<Writable<Edition>>(EDITION);

    let embedNode = embed === null ? null : Parser.parseEmbed($edition, embed);

</script>

{#if embedNode instanceof EmbedNode }
    <img 
        style="width: 5em"
        src={embedNode.getSmallURL() }
        alt={embedNode.getDescription() }
    />
{/if}