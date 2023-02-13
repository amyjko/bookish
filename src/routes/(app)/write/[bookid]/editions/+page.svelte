<script lang="ts">
    import Editions from '$lib/components/page/Editions.svelte';
    import { getBook } from '$lib/components/page/Contexts';
    import Feedback from '$lib/components/app/Feedback.svelte';
    import Section from '$lib/components/app/Section.svelte';
    import Lead from '$lib/components/app/Lead.svelte';
    import Large from '$lib/components/app/Large.svelte';

    let book = getBook();
</script>

{#if $book}
    <Section>
        <Lead><Large>Editions</Large><br />{$book.title}</Lead>

        <Editions />
    </Section>
{:else}
    <Feedback error>This book couldn't be found.</Feedback>
{/if}
