import React from 'react'
import "../styles/skeleton.scss"

export default function Skeleton({ style, count = 1 }) {
    const rows = []
    for (let i = 0; i < count; i++) {
        rows.push(
            <div className={`skeleton rounded-lg fadeIn`} style={style} key={Math.random()}></div>)
    }
    return (
        <>
            {rows}
        </>
    )
}