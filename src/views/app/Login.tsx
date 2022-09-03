import React, { useRef, useState } from "react"
import { useAuth } from "./AuthContext"

export default function Login() {

	const emailRef = useRef<HTMLInputElement>(null)
	const { login } = useAuth()

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
				// Give some feedback when loading.
				setLoading(true);
				await login(emailRef.current.value);
				setFeedback("Check your email for a login link.")
			} catch(err) {
				setFeedback("Hm, couldn't create an account: " + err)
			} finally {
				setLoading(false)
			}
		}

	}

	return <>

		<h1>Ready to write?</h1>

		<p>We'll send you an email to login, no password required.</p>

		<form onSubmit={handleSubmit}>
			<input autoComplete="username" type="email" placeholder="email" ref={emailRef} required disabled={loading} /> <button type="submit" disabled={loading}>Login</button>
		</form>

		{ feedback && <div className="bookish-app-alert">{feedback}</div> }

	</>

}