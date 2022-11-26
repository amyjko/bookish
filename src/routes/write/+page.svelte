<script lang="ts">
    import { createBookInFirestore, loadUsersBooksFromFirestore } from '$lib/models/Firestore';
    import BookPreview from '$lib/components/BookPreview.svelte'
    import type Book from "$lib/models/book/Book"
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { getAuth } from '$lib/components/page/Contexts';
	import Alert from "$lib/components/page/Alert.svelte";
    import Title from '$lib/components/page/Title.svelte';

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

	let creating = false;
	let timeSinceCreation = 0;
	let creationFeedback = "";

	function newBook() {
		creating = true;
		creationFeedback = "Creating book...";
		timeSinceCreation = Date.now();
		const timerID = setInterval(() => {
			const delta = Date.now() - timeSinceCreation;
			creationFeedback = 
				delta < 3000 ? "Creating book..." :
				delta < 6000 ? "Still trying to create book..." :
				delta < 9000 ? "Internet is slow or offline, but will keep trying..." :
				"Sorry this is taking so long! If the internet connection comes back, we will create the book."
		}, 1000);
		// Make the book, then go to its page
		if($auth.user)
			createBookInFirestore($auth.user.uid)
				.then(bookID => 
					goto("/write/" + bookID))
				.catch(error => {
					creating = false;
					error = "Couldn't create a book: " + error; 
				})
				.finally(() => clearInterval(timerID))

	}
	
</script>

<Title>Write</Title>

<p>
    <button on:click={newBook} disabled={creating}>Create book</button>
</p>
{#if creating}
	<Alert>{creationFeedback}</Alert>
{/if}

<p>
    Books you can edit.
</p>

{#if error }
    <Alert>{error}</Alert>
{:else if loading }
    <p>Loading books...</p>
{:else}
    {#each books as book }
        <BookPreview book={book} write={true} />
    {:else}
        <p>You don't have have any books.</p>
    {/each}
{/if}