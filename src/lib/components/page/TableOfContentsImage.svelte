<script lang="ts">
    import EmbedNode from '$lib/models/chapter/EmbedNode';
    import Parser from '$lib/models/chapter/Parser';
    import { getBase, getEdition } from './Contexts';
    import Link from '../Link.svelte';

    export let embed: string | null;
    export let url: string | undefined;

    let edition = getEdition();
    let base = getBase();

    $: embedNode = embed === null ? null : Parser.parseEmbed($edition, embed);
</script>

{#if embedNode instanceof EmbedNode}
    <Link to={url ?? ''} linked={url !== undefined}>
        <img
            src={embedNode.isLocal()
                ? `${$base}/${embedNode.getSmallURL()}`
                : embedNode.getSmallURL()}
            alt={embedNode.getDescription()}
        />
    </Link>
{/if}

<style>
    img {
        width: 5em;
    }
</style>
