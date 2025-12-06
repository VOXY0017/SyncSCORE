'use client';
import {
  Auth, // Import Auth type for type hinting
  signOut,
} from 'firebase/auth';

/** Signs the current user out (non-blocking). */
export function signOutUser(authInstance: Auth): void {
  signOut(authInstance);
}
