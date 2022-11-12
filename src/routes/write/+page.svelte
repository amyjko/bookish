<script lang="ts">
    import { createBookInFirestore, loadUsersBooksFromFirestore } from '$lib/models/Firestore';
    import BookPreview from '$lib/components/BookPreview.svelte'
    import type Book from "$lib/models/book/Book"
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { getAuth } from '$lib/components/page/Contexts';

	let books: Book[] = [];
	let loading = true;
	let error = "";

	let auth = getAuth();

	function updateBooks() {
		if($auth.user)
			loadUsersBooksFromFirestore($auth.user.uid).then(loadedBooks => {
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

	function newBook() {
		// Make the book, then go to its page
		if($auth.user)
			createBookInFirestore($auth.user.uid)
				.then(bookID => goto("/write/" + bookID))
				.catch(error => { console.error(error); error = "Couldn't create a book: " + error; })

	}
	
</script>

<h1>Write</h1>

<p>
    <button on:click={newBook}>Create book</button>
</p>

<p>
    Books you can edit.
</p>

{#if error }
    <div class="bookish-app-alert">{error}</div>
{:else if loading }
    <p>Loading books...</p>
{:else}
    {#each books as book }
        <BookPreview book={book} write={true} />
    {:else}
        <p>You don't have have any books.</p>
    {/each}
{/if}