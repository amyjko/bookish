import type { Position } from "../../models/chapter/Position";

const renderPosition = (position: Position) => 
    position === "<" ? "bookish-marginal-left-inset" : 
    position === ">" ? "bookish-marginal-right-inset" : 
    ""
export default renderPosition;