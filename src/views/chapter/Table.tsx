import { TableNode } from "../../models/chapter/TableNode"
import Format from './Format'
import renderPosition from "./renderPosition"

const Table = (props: { node: TableNode}) => {

    const { node } = props
    const rows = node.getRows();
    const caption = node.getCaption();
    const position = node.getPosition();

    return <div className={"bookish-figure " + renderPosition(position)} data-nodeid={props.node.nodeID}>
        {/* Make the table responsive for small screens */}
        <div className="bookish-table">
            <table>
                <tbody>
                {
                    rows.map((row, index) => 
                        <tr key={"row-" + index}>
                            {
                                row.length === 1 ?
                                    [<td key={"cell-" + index} colSpan={rows.reduce((max, row) => Math.max(row.length, max), 0)}><Format node={row[0]} key={"cell-" + index}/></td>] :
                                    row.map((cell, index) => <td key={"cell-" + index}><Format node={cell} key={"cell-" + index}/></td>)
                            }
                        </tr>
                    )
                }
                </tbody>
            </table>
        </div>
        { caption === undefined ? null : <div className="bookish-figure-caption"><Format node={caption} placeholder="caption"/></div> }
    </div>

}

export default Table;