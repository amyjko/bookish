import { useAuth } from "./AuthContext"
import { Link } from "react-router-dom"
import BookishNavLink from "./BookishNavLink"

import icon from "../../assets/icons/icon.png";

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
		<img src={icon}/>&nbsp;
		<BookishNavLink to="/">Home</BookishNavLink>
		<BookishNavLink to="/read">Read</BookishNavLink>
		<BookishNavLink to="/write">Write</BookishNavLink>
		<small>
			{ currentUser && currentUser.email && <BookishNavLink to="/email">{currentUser.email}</BookishNavLink> }
			{
				currentUser === null ?
					<BookishNavLink to="/login">Login</BookishNavLink> :
					<Link to="/" onClick={handleLogout}>Logout</Link>		
			}
		</small>
	</div>
}