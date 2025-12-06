'use client';
import {
  Auth, 
  signOut,
} from 'firebase/auth';

/** Signs the current user out (non-blocking). */
export function signOutUser(authInstance: Auth): void {
  signOut(authInstance).catch((error) => {
    // Although unlikely, you could handle potential sign-out errors here
    console.error("Error signing out: ", error);
  });
}
