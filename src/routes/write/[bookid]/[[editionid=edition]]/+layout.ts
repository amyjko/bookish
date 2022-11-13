import { loadBookFromFirestore } from "$lib/models/Firestore";
import { error } from "@sveltejs/kit";

export async function load(context: { params: Record<string,string> }) {

    const bookID = context.params.bookid;
    const possibleEditionID = context.params.editionid;
    const possibleEditionNumber = possibleEditionID === undefined ? undefined : parseInt(possibleEditionID);

    const book = await loadBookFromFirestore(bookID);

    const edition = possibleEditionNumber === undefined || isNaN(possibleEditionNumber) || !book.isValidEditionNumber(possibleEditionNumber) ? 
        await book.getDraftEdition() : 
        await book.getEditionNumber(possibleEditionNumber);

    if(edition === undefined)
        throw error(404, "This book has no editions.");

    return { book: book, edition: edition };

}