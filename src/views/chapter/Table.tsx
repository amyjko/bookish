import React from 'react'
import { TableNode } from '../../models/Parser'

import { renderNode, renderPosition } from './Renderer'

const Table = (props: { node: TableNode}) => {

    const { node } = props

    return <div className={"bookish-figure " + renderPosition(node.position)}>
        {/* Make the table responsive for small screens */}
        <div className="bookish-table">
            <table>
                <tbody>
                {
                    node.rows.map((row, index) => 
                        <tr key={"row-" + index}>
                            {
                                row.length === 1 ?
                                    [<td key={"cell-" + index} colSpan={node.rows.reduce((max, row) => Math.max(row.length, max), 0)}>{renderNode(row[0], "cell-" + index)}</td>] :
                                    row.map((cell, index) => <td key={"cell-" + index}>{renderNode(cell, "cell-" + index)}</td>)
                            }
                        </tr>
                    )
                }
                </tbody>
            </table>
        </div>
        <div className="bookish-figure-caption">{renderNode(node.caption)}</div>
    </div>

}

export default Table