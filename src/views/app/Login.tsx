import React, { useRef, useState } from "react"
import { useAuth } from "./AuthContext"

export default function Login() {

	const emailRef = useRef<HTMLInputElement>(null)
	const { login } = useAuth()

	// Track errors with state
	const [ error, setError ] = useState("")

	// Not loading by default
	const [ loading, setLoading ] = useState(false)

	// Track feedback with state
	const [ feedback, setFeedback ] = useState("")

	async function handleSubmit(e: React.FormEvent) {

		// Prevent page reload
		e.preventDefault();

		// Enter loading state, try to login and wait for it to complete, and then leave loading state.
		if(login && emailRef && emailRef.current) {
			try {
				setLoading(true);
				await login(emailRef.current.value);
				setFeedback("Check your email for a link.")
			} catch(err) {
				setError("Failed to create an account: " + err)
			}
			setLoading(false);
		}

	}

	return <>

		<h1>Ready to write?</h1>

		<p>We'll send you an email to login, no password required.</p>

		{/* Show errors if there are any */}
		{ error && <div className="bookish-app-alert">{error}</div> }

		{/* Show feedback if there is any */}
		{ feedback && <div className="bookish-app-alert">{feedback}</div> }

		<form onSubmit={handleSubmit}>
			<input type="email" placeholder="email" ref={emailRef} required /> <button type="submit" disabled={loading}>Login</button>
		</form>
	</>

}