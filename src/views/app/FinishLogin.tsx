import React from "react"
import { getAuth, isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth"
import { useNavigate } from "react-router-dom"

export default function FinishLogin() {

	const navigate = useNavigate()
	const auth = getAuth();

	if (isSignInWithEmailLink(auth, window.location.href)) {
		// Additional state parameters can also be passed via URL.
		// This can be used to continue the user's intended action before triggering
		// the sign-in operation.
		// Get the email if available. This should be available if the user completes
		// the flow on the same device where they started it.
		let email = window.localStorage.getItem('email');
		if (!email) {
			// TODO Handle sign in on different device
			// User opened the link on a different device. To prevent session fixation
			// attacks, ask the user to provide the associated email again. For example:
			email = window.prompt('Please provide your email for confirmation');
		}
		// The Firebase client SDK will parse the code.
		if(email)
			signInWithEmailLink(auth, email, window.location.href)
				.then((result) => {
					
					// Clear email from storage.
					window.localStorage.removeItem('email');
					
					// You can access the new user via result.user
					// Additional user info profile not available via:
					// result.additionalUserInfo.profile == null
					// You can check if the user is new or existing:
					// result.additionalUserInfo.isNewUser

					// Navigate to the home page.
					navigate("/write")

				})
				.catch((error) => {
					// TODO Handle error
					// Some error occurred, you can inspect the code: error.code
					// Common errors could be invalid email and invalid or expired OTPs.
				});
		else 
			// TODO Something better here.
			console.error("No email provided.")
				
	}

	return <>
		<p>Finishing login...</p>
	</>

}