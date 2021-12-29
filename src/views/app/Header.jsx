import React from "react"
import { Nav, Navbar, Container } from "react-bootstrap"
import { useAuth } from "../../contexts/AuthContext"
import { Link } from "react-router-dom"

export default function Header() {

	const { currentUser, logout } = useAuth()

	// Ask the auth context to logout, and provided an error if it fails.
	async function handleLogout() {
		try {
			await logout()
		} catch {
			// TODO Handle errors.
		}
	}
	
	return <Navbar bg="light" expand="sm">
		<Container fluid>
			<Navbar.Brand as={Link} to="/">
				<img src="/images/icons/icon.png" style={{height: "1em"}} /> Bookish
			</Navbar.Brand>
			<Navbar.Toggle aria-controls="basic-navbar-nav" />
			<Navbar.Collapse className="me-auto">
				<Nav.Link as={Link} to="/browse">Browse</Nav.Link>
				<Nav.Link as={Link} to="/about">About</Nav.Link>
				{
					currentUser === null ?
						<Nav.Link as={Link} to="/login">Login</Nav.Link> :
						<>
							<Nav.Link as={Link} to="/dashboard">Dashboard</Nav.Link>
							<Nav.Link as={Link} to="/" onClick={handleLogout}>Logout</Nav.Link>
						</>
				}
				<small>{ currentUser && currentUser.email }</small>
			</Navbar.Collapse>
		</Container>
	</Navbar>
}