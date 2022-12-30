import ReferenceNode from '../models/chapter/ReferenceNode';

export function mineReference(ids: string[], text: string): ReferenceNode {
    // First find the year, since it's the most easily detected. Optional parens.
    let yearMatches = text.match(/(\(?[0-9]{4}\)?)/);
    let year =
        yearMatches !== null && yearMatches.length > 0
            ? yearMatches[1].replace('(', '').replace(')', '')
            : undefined;
    if (year && yearMatches) text = text.replace(yearMatches[1], '');

    // Split the remaining text by period-space sequences, assuming chunks of information are segmented by sentences.
    // let chunks = text.split(/(?<![A-Z])[?.]\s/);
    // Grrr, Safari doesn't support negative lookbehind. I'm going to break this until I have time for a fix.
    let chunks = text.split(/[?.]\s/);

    // First find the URL. If we find it, remove it from the chunks.
    let url = chunks.find((t) => t.indexOf('http') >= 0);
    if (url) {
        chunks = chunks.filter((t) => t !== url);
        url = url.trim();
    }

    // Authors are usually lists of roman characters and periods optionally followed by commas or semicolons
    let authors = chunks.find((t) => /[a-zA-Z\.]+[,;]?/.test(t));
    if (authors) {
        chunks = chunks.filter((t) => t !== authors);
        authors = authors.trim();
    }

    // Titles are usually lists of roman characters and spaces and maybe a colon.
    let title = chunks.find((t) => /[a-zA-Z0-9:!#?]+/.test(t));
    if (title) {
        chunks = chunks.filter((t) => t !== title);
        if (text.charAt(text.indexOf(title) + title.length) === '?')
            title = title + '?';
    }

    // Source is whatever is left.
    let source = chunks.length > 0 ? chunks[0] : undefined;
    if (source) {
        chunks = chunks.filter((t) => t !== source);
    }

    // If there's anything left, fall back to just a string.
    return chunks.length > 0
        ? new ReferenceNode(getUniqueReferenceID(ids), text)
        : new ReferenceNode(
              getUniqueReferenceID(ids, authors, year),
              authors || '',
              year || '',
              title || '',
              source || '',
              url || '',
              '',
              false
          );
}

export function getUniqueReferenceID(
    ids: string[],
    authors?: string,
    year?: string
): string {
    if (authors && year) {
        // Split the authors, combine the first initials of each, then append the year.
        const semicolons = authors.includes(';');
        const authorList = authors
            .split(semicolons ? /;\s+/ : /,\s+/)
            .map((t) => t.trim());
        const initials = authorList.map((a) => a.charAt(0).toLocaleLowerCase());
        const id = initials.join('') + year;
        let revisedID = id;
        let letters = 'abcdefghijklmnopqrstuv'.split('');
        while (ids.includes(revisedID) || revisedID.length === 0) {
            const letter = letters.shift();
            revisedID =
                id +
                (letter !== undefined
                    ? letter
                    : Math.floor(Math.random() * 10));
        }
        return revisedID;
    } else {
        let id = 'ref';
        for (let i = 0; i < 4; i++) id = id + Math.round(Math.random() * 9);
        return id;
    }
}
