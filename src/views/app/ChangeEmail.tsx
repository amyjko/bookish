import { updateEmail } from "firebase/auth"
import React, { useRef, useState } from "react"
import { useAuth } from "./AuthContext"

export default function Login() {

	const emailRef = useRef<HTMLInputElement>(null)
	const { currentUser } = useAuth()

	const [ loading, setLoading ] = useState(false)
	const [ feedback, setFeedback ] = useState("")

	const errors: Record<string,string> = {
		"auth/invalide-mail": "This wasn't a valid email.",
		"auth/email-already-in-use": "This email is already associated with an account.",
		"auto/requires-recent-login": "You haven't logged in recently enough. Log out, log in again, then try again."
	};

	async function handleSubmit(e: React.FormEvent) {

		// Prevent page reload
		e.preventDefault();

		// Enter loading state, try to login and wait for it to complete, and then leave loading state.
		if(currentUser && emailRef && emailRef.current) {
			try {
				// Give some feedback when loading.
				setLoading(true);
				const previousEmail = currentUser.email;
				await updateEmail(currentUser, emailRef.current.value);
				setFeedback(`Check your original email address, ${previousEmail}, for a confirmation link.`);
			} catch(error: any) {
				if(typeof error.code === "string")
					setFeedback(errors[error.code])
			} finally {
				setLoading(false)
			}
		}

	}

	return <>

		<h1>Change e-mail</h1>

		<p>
			To change your login email, type your new email address below.
		</p>

		<form onSubmit={handleSubmit}>
			<input autoComplete="username" type="email" placeholder="email" ref={emailRef} required disabled={loading || emailRef.current?.value.length === 0} /> <button type="submit" disabled={loading}>Login</button>
		</form>

		{ feedback && <div className="bookish-app-alert">{feedback}</div> }

	</>

}