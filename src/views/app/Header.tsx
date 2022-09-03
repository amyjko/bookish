import React from "react"
import { useAuth } from "./AuthContext"
import { Link } from "react-router-dom"

export default function Header() {

	const { currentUser, logout } = useAuth()

	// Ask the auth context to logout, and provided an error if it fails.
	async function handleLogout() {
		if(logout)
			try {
				await logout()
			} catch {
				// TODO Handle errors.
			}
	}
	
	return <div className="bookish-app-header">
		<img src="/images/icons/icon.png"/>
		<Link to="/"> Home</Link>
		<Link to="/read">Read</Link>
		<Link to="/write">Write</Link>
		<Link to="/about">About</Link>
		<small>
			{ currentUser && currentUser.email }
			{
				currentUser === null ?
					<Link to="/login">Login</Link> :
					<Link to="/" onClick={handleLogout}>Logout</Link>		
			}
		</small>
	</div>
}