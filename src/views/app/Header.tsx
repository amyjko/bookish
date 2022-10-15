import { useAuth } from "./AuthContext"
import { Link } from "react-router-dom"
import BookishNavLink from "./BookishNavLink"

import icon from "../../assets/icons/icon.png";
import { getSubdomain, pathWithoutSubdomain } from "../util/getSubdomain";

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
	
	const subdomain = getSubdomain();

	function getLink(path: string, label: string) {
		return subdomain !== undefined ? 
			<a href={pathWithoutSubdomain(path)}>{label}</a> : 
			<BookishNavLink to={path}>{label}</BookishNavLink>
	}

	return <div className="bookish-app-header">
		<img src={icon}/>&nbsp;
		{ getLink("/", "Home") }
		{ getLink("/read", "Read") }
		{ getLink("/write", "Write") }
		<small>
			{ currentUser && currentUser.email && getLink("/email", currentUser.email) }
			{
				currentUser === null ?
					getLink("/login", "Login") :
					<Link to={pathWithoutSubdomain("/")} onClick={handleLogout}>Logout</Link>		
			}
		</small>
	</div>
}