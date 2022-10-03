import React from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "./AuthContext"

const Private: React.FC<{children?: React.ReactNode}> = ({ children }) => {

    const { currentUser } = useAuth()

    return (
        currentUser ? <>{children}</> : <Navigate to="/login" />
    )
}

export default Private