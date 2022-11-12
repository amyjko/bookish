import type Chapter from "../../models/book/Chapter";

type ChapterContext = {
	chapter: Chapter,
	highlightedWord?: string,
	highlightedID?: string,
	marginalID?: string,
	setMarginal: (id: string | undefined) => void,
	layoutMarginals: () => void
} | undefined;
export default ChapterContext;