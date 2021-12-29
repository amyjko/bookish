import React from 'react'

import { renderNode, renderPosition } from './Renderer'

function Table(props) {

    const { node, context, key } = props

    return <div key={key} className={"figure " + renderPosition(node.position)}>
        {/* Make the table responsive for small screens */}
        <div className="rows table-responsive">
            <table className="table">
                <tbody>
                {
                    node.rows.map((row, index) => 
                        <tr key={"row-" + index}>
                            {
                                row.length === 1 ?
                                    [<td key={"cell-" + index} colSpan={node.rows.reduce((max, row) => Math.max(row.length, max), 0)}>{renderNode(row[0], context, "cell-" + index)}</td>] :
                                    row.map((cell, index) => <td key={"cell-" + index}>{renderNode(cell, context, "cell-" + index)}</td>)
                            }
                        </tr>
                    )
                }
                </tbody>
            </table>
        </div>
        <div className="figure-caption">{renderNode(node.caption, context)}</div>
    </div>

}

export default Table