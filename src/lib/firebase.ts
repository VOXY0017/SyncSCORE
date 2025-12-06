import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// IMPORTANT: Replace with your own Firebase project's configuration.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// --- Firebase Security Rules Recommendation ---
// To secure your data, apply the following Firestore security rules in the Firebase console.
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /players/{playerId} {
      // Anyone can read the list of players and their scores.
      allow read: if true;

      // Only authenticated users (or server) can create, update, and delete.
      // The rules below assume a simple authenticated user model.
      // For production, you might use server-side validation or custom claims (e.g., admin roles).

      // New players must have a name and a score of 0.
      allow create: if request.auth != null
                      && 'name' in request.resource.data
                      && request.resource.data.name.size() > 0
                      && request.resource.data.score == 0;

      // A score can only be updated by incrementing by 1 or -1. Name cannot be changed.
      allow update: if request.auth != null
                    && request.resource.data.name == resource.data.name
                    && (request.resource.data.score == resource.data.score + 1 ||
                        request.resource.data.score == resource.data.score - 1);

      // Allow deletion by authenticated users.
      allow delete: if request.auth != null;
    }
  }
}
*/

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// Enable offline persistence if in the browser
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db)
    .catch((err) => {
      if (err.code == 'failed-precondition') {
        console.warn('Firestore persistence failed: Multiple tabs open.');
      } else if (err.code == 'unimplemented') {
        console.warn('Firestore persistence failed: Browser does not support it.');
      }
    });
}

export { db };
