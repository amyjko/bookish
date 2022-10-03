import React from "react";
import EditionModel from "../../models/book/Edition";

export const EditorContext = React.createContext<{ 
	edition: EditionModel | undefined,
	editable: boolean 
}>({ edition: undefined, editable: false });