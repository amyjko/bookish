import Reference from '../models/book/Reference';

export function mineReference(ids: string[], text: string): Reference {
    // First find the year, since it's the most easily detected. Optional parens.
    let yearMatches = text.match(/(\(?[0-9]{4}(,[a-zA-Z ]+)?\)?)/);
    let year =
        yearMatches !== null && yearMatches.length > 0
            ? yearMatches[1].replace('(', '').replace(')', '')
            : undefined;
    if (year && yearMatches) {
        const digits = year.match(/([0-9]{4})/);
        if (digits !== null) year = digits[1];
        text = text.replace(yearMatches[1], '');
    }

    // Next, find the URL
    let url: string | null = null;
    let urlMatches = text.match(
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_\+.~#?&\/\/=]*)/,
    );
    if (urlMatches !== null && urlMatches.length > 0) {
        url = urlMatches[0];
        const index = text.indexOf(url);
        text = text.substring(0, index) + text.substring(index + url.length);
    }

    // Split the remaining portion into sentences.
    let chunks = splitIntoSentences(text);

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
        title = title.trim();
    }

    // Source is whatever is left.
    let source = chunks.length > 0 ? chunks[0] : undefined;
    if (source) {
        chunks = chunks.filter((t) => t !== source);
        source = source.trim();
    }

    // If there's anything left, fall back to just a string.
    return new Reference(
        getUniqueReferenceID(ids, authors, year),
        authors || '',
        year || '',
        title || '',
        source || '',
        url || '',
        '',
        false,
    );
}

export function splitIntoSentences(text: string): string[] {
    // Split the remaining text by period-space sequences, assuming chunks of information are segmented by sentences
    // unless they are single initials followed by a period.
    let sentences: string[] = [];
    let priorLetterSequence = '';
    let accumulator = '';
    for (let i = 0; i < text.length; i++) {
        let char = text.charAt(i);
        if (/[a-zA-Z]/.test(char)) {
            priorLetterSequence += char;
            accumulator += char;
        } else {
            if (char === '.' && priorLetterSequence.length !== 1) {
                sentences.push(accumulator);
                accumulator = '';
                priorLetterSequence = '';
            } else {
                priorLetterSequence = '';
                accumulator += char;
            }
        }
    }
    if (accumulator.length > 0) sentences.push(accumulator);

    return sentences;
}

export function getUniqueReferenceID(
    ids: string[],
    authors?: string,
    year?: string,
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
        let id = '00';
        for (let i = 0; i < 4; i++) id = id + Math.round(Math.random() * 9);
        return id;
    }
}
