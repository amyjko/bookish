import { Form, Button, Card, Alert } from 'react-bootstrap'
import React, { useRef, useState } from "react"
import { useAuth, AuthProvider } from "../contexts/AuthContext"

export default function Login() {

	const emailRef = useRef()
	const { login } = useAuth()

	// Track errors with state
	const [ error, setError ] = useState("")

	// Not loading by default
	const [ loading, setLoading ] = useState(false)

	// Track feedback with state
	const [ feedback, setFeedback ] = useState("")

	async function handleSubmit(e) {

		// Prevent page reload
		e.preventDefault();

		// Enter loading state, try to login and wait for it to complete, and then leave loading state.
		try {
			setLoading(true);
			await login(emailRef.current.value);
			setFeedback("Check your email for a link.")
		} catch(err) {
			setError("Failed to create an account: " + err)
		}
		setLoading(false);

	}

	return <>
		<Card>
			<Card.Body>

				<h2>Login</h2>
				<p>We'll send you an email to login, no password required.</p>

				{/* Show errors if there are any */}
				{ error && <Alert variant="danger">{error}</Alert> }

				{/* Show feedback if there is any */}
				{ feedback && <Alert>{feedback}</Alert> }

				<Form onSubmit={handleSubmit}>
					<Form.Group id="email">
						<Form.Label>Email</Form.Label>
						<Form.Control type="email" ref={emailRef} required />
					</Form.Group>
					<Button type="submit" disabled={loading}>Login</Button>
				</Form>

			</Card.Body>
		</Card>
	</>

}