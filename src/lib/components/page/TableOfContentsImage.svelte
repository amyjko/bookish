<script lang="ts">
    import EmbedNode from '$lib/models/chapter/EmbedNode';
    import Parser from '$lib/models/chapter/Parser';
    import { getBase, getEdition } from './Contexts';
    import Link from '../Link.svelte';

    interface Props {
        embed: string | null;
        url: string | undefined;
    }

    let { embed, url }: Props = $props();

    let edition = getEdition();
    let base = getBase();

    let embedNode = $derived(embed === null ? null : Parser.parseEmbed($edition, embed));
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
