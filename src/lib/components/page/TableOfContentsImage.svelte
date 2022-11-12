<script lang="ts">
    import EmbedNode from "$lib/models/chapter/EmbedNode";
    import Parser from "$lib/models/chapter/Parser";
    import { getEdition } from "./Contexts";

    export let embed: string | null;

    let edition = getEdition();

    $: embedNode = embed === null ? null : Parser.parseEmbed($edition, embed);

</script>

{#if embedNode instanceof EmbedNode }
    <img 
        style="width: 5em"
        src={embedNode.getSmallURL() }
        alt={embedNode.getDescription() }
    />
{/if}