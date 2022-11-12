import type Chapter from "../../models/book/Chapter";

type ChapterContext = {
	chapter: Chapter,
	highlightedWord?: string,
	highlightedID?: string,
	marginalID?: string,
	setMarginal?: Function,
	layoutMarginals?: Function
}
export default ChapterContext;