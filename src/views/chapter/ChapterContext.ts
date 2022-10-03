import React from "react"
import Edition from "../../models/book/Edition"
import ChapterModel from '../../models/book/Chapter'

export type ChapterContextType = {
	book?: Edition, 
	chapter?: ChapterModel, 
	highlightedWord?: string,
	highlightedID?: string,
	marginalID?: string,
	setMarginal?: Function,
	layoutMarginals?: Function
}

export const ChapterContext = React.createContext<ChapterContextType>({})
