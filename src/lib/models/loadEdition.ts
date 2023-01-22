import type Edition from './book/Edition';
import { getBookFromIDOrName } from './CRUD';

export default async function loadEdition(
    bookIDOrName: string,
    editionNumber: string | undefined,
    latestPublished: boolean
): Promise<Edition | undefined> {
    const book = await getBookFromIDOrName(bookIDOrName);

    if (book === null) return undefined;

    const edition =
        editionNumber === undefined
            ? await (latestPublished
                  ? book.getLatestPublishedEdition()
                  : book.getLatestEdition())
            : await book.getEditionNumber(parseFloat(editionNumber));

    return edition;
}
