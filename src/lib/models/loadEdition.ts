import { getBookFromIDOrName } from './Firestore';

export default async function loadEdition(
    bookIDOrName: string,
    editionID: string | undefined,
    latestPublished: boolean
) {
    const getEditionNumber =
        editionID === undefined ? undefined : parseInt(editionID);

    const book = await getBookFromIDOrName(bookIDOrName);

    if (book === null) return null;

    const unspecifiedEdition =
        getEditionNumber === undefined ||
        isNaN(getEditionNumber) ||
        !book.isValidEditionNumber(getEditionNumber);
    const edition = unspecifiedEdition
        ? await (latestPublished
              ? book.getLatestPublishedEdition()
              : book.getDraftEdition())
        : await book.getEditionNumber(getEditionNumber);

    return {
        book: book,
        edition: edition,
        latest: unspecifiedEdition,
    };
}
