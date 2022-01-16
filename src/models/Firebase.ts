import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

// Initialize Firebase using the environment variables provided at build time.
// Only do this if we have environment variables defined. (We won't in the standalone Reader).
export const app = process.env.reader ? undefined : initializeApp({
    apiKey: process.env.BOOKISH_FIREBASE_API_KEY,
    authDomain: process.env.BOOKISH_AUTH_DOMAIN,
    projectId: process.env.BOOKISH_PROJECT_ID,
    storageBucket: process.env.BOOKISH_STORAGE_BUCKET,
    messagingSenderId: process.env.BOOKISH_MESSAGING_SENDER_ID,
    appId: process.env.BOOKISH_APP_ID
  });

export const auth = process.env.reader ? undefined : getAuth()
export const db = process.env.reader ? undefined : getFirestore()
