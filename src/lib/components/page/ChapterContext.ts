import type { Writable } from "svelte/store";
import type Chapter from "../../models/book/Chapter";

type ChapterContext = {
	chapter: Chapter,
	highlightedWord?: string,
	highlightedID?: string,
	marginal: Writable<string|undefined>,
	layoutMarginals: () => void
} | undefined;
export default ChapterContext;