<script lang="ts">
    import { loadPublishedBooksFromFirestore } from '$lib/models/Firestore';
    import BookPreview from '$lib/components/BookPreview.svelte'
    import type Book from "$lib/models/book/Book"
    import { onMount } from 'svelte';
	import Feedback from "$lib/components/app/Feedback.svelte";
    import Lead from '$lib/components/app/Lead.svelte';
    import Paragraph from '$lib/components/app/Paragraph.svelte';
    import Large from '$lib/components/app/Large.svelte';
    import Table from '$lib/components/app/Table.svelte';

	let books: Book[] = [];
	let loading = true;
	let error = "";

	function updateBooks() {
        loadPublishedBooksFromFirestore().then(loadedBooks => {
            loading = false;
            if(loadedBooks === null)
                error = "Unable to load books";
            else
                books = loadedBooks;
        })
	}

	// Get the books when the component loads.
	onMount(() => {
		updateBooks()
	});
	
</script>

<Lead><Large>Books</Large> published.</Lead>

{#if error }
    <Feedback error>{error}</Feedback>
{:else if loading }
    <Feedback>Loading books...</Feedback>
{:else if books.length === 0}
	<Paragraph>You don't have have any books.</Paragraph>
{:else}
	<Table>
		{#each books as book }
			<BookPreview book={book} write={true} />
		{/each}
	</Table>
{/if}