import React, { useContext, useEffect, useState } from "react"
import { sendSignInLinkToEmail, User } from "firebase/auth"
import { auth } from "../../models/Firebase"

const AuthContext = React.createContext<{
    currentUser?: User | null,
    loading?: boolean,
    login?: Function,
    logout?: Function
}>({});

// A convenience function for components in the app to access authentication functionality.
export function useAuth() {
    return useContext(AuthContext)
}

// Wraps authentication functionality in a React context for use by components.
const AuthProvider: React.FC<{}> = ({ children }) => {

    // Track the user and user loading status in state
    const [ currentUser, setCurrentUser ] = useState<User | null>(null);
    const [ loading, setLoading ] = useState(true);

    // Login using Firebase's password-less email verification
    function login(email: string) {

        if(auth) {

            const actionCodeSettings = {
                url: process.env.DOMAIN + "/finishlogin",
                handleCodeInApp: true
            }

            // Ask Firebase to log in with the given email
            sendSignInLinkToEmail(auth, email, actionCodeSettings)
                .then(() => {
                    // Remember the email in local storage so we don't have to ask for it again
                    // after returning to the link above.
                    window.localStorage.setItem("email", email)
                });

        }

    }

    // Logout using Firebase's authentication framework.
    function logout() {
        if(auth)
            return auth.signOut()
    }

    // Whenever the authorization state changes, update the user and loading state.
    // Unsubscribe whenever the component unloads by returning the unsubscribe callback
    // provided by Firebase Auth.
    useEffect(() => {
        if(auth) {
            const unsubscribe = auth.onAuthStateChanged(user => {
                setCurrentUser(user);
                setLoading(false);
            });
            return unsubscribe;
        }
    }, []);

    // Expose the state and the login/logout functionality.
    const value = {
        currentUser,
        loading,
        login,
        logout,
    };

    // Wrap whatever children are given in this context.
    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );

}

export { AuthProvider };