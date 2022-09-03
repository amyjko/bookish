import React, { ReactElement, useEffect, useState } from "react"
import { getAuth, isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth"
import { Link, useNavigate } from "react-router-dom"

export default function FinishLogin() {

	const navigate = useNavigate()
	const auth = getAuth();
	
	const [ feedback, setFeedback ] = useState<undefined | ReactElement>(undefined);

	const messages: Record<string, string> = {
		"auth/id-token-expired": "This link expired.",
		"auth/id-token-revoked": "This link isn't valid anymore.",
		"auth/insufficient-permission": "This email doesn't have permission to create an account.",
		"auth/internal-error": "There's a problem at Google.",
		"auth/invalid-argument": "This link isn't valid.",
		"auth/invalid-email": "This wasn't a valid email.",
	};

	useEffect(() => {

		if (isSignInWithEmailLink(auth, window.location.href)) {
			// If this is on the same device and browser, then the email should be in local storage.
			let email = window.localStorage.getItem('email');
	
			// If not, ask the user to confirm it.
			if (!email)
				email = window.prompt("It appears you opened your login link on a different device or browser. Can you confirm your email?");
	
			// If there's an email, try signing in.
			if(email)
				signInWithEmailLink(auth, email, window.location.href)
					.then(() => {
						
						// Clear email from storage now that the user is logged in.
						window.localStorage.removeItem('email');
						
						// Navigate to the home page.
						navigate("/write")
	
					})
					.catch((error: { code: string }) => {
						setFeedback(<span>{messages[error.code] ?? <>There was a problem logging you in.</>} <Link to="/login">Try again</Link>?</span>);
					});
			// Otherwise, give some feedback.
			else 
				setFeedback(<span>Can't log in without an email address. Refresh the page to try again.</span>);
					
		}
		// GIve some feedback if the email link isn't valid.
		else 
			setFeedback(<span>This isn't a valid login link. <Link to="/login">Try again</Link>?</span>);
	
	}, [])


	return <>
		<h1>Finishing login...</h1>
		{ feedback ? <div className="bookish-app-alert">{feedback}</div> : <p>Redirecting...</p> }
	</>

}