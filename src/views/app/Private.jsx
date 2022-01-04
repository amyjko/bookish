import React from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "./AuthContext"

export default function Private({ children }) {

    const { currentUser } = useAuth()

    return (
        currentUser ? children : <Navigate to="/login" />
    )
}