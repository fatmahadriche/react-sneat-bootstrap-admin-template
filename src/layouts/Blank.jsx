import React from 'react'
import { Link } from 'react-router-dom'

export const Blank = ({ children }) => {
    return (
        <div className="blank-layout">
            {children}
        </div>
    )
}