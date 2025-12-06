'use server';

import { collection, query, where, getDocs, doc, increment, Firestore } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

// Note: Removed initializeFirebase() from the server action file.
// The firestore instance will now be passed from the client.

export async function addPlayer(firestore: Firestore, name: string): Promise<{ success: boolean; error?: string }> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return { success: false, error: 'Player name cannot be empty.' };
  }

  try {
    const playersRef = collection(firestore, 'players');
    const q = query(playersRef, where('name', '==', trimmedName));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return { success: false, error: 'A player with this name already exists.' };
    }

    addDocumentNonBlocking(playersRef, {
      name: trimmedName,
      score: 0,
    });
    return { success: true };
  } catch (error) {
    console.error("Error adding player: ", error);
    return { success: false, error: 'Failed to add player. Check server logs and Firebase setup.' };
  }
}

export async function updatePlayerScore(firestore: Firestore, playerId: string, change: 1 | -1): Promise<{ success: boolean; error?: string }> {
  if (!playerId) {
    return { success: false, error: 'Player ID is required.' };
  }

  try {
    const playerDocRef = doc(firestore, 'players', playerId);
    updateDocumentNonBlocking(playerDocRef, {
      score: increment(change),
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating score: ", error);
    return { success: false, error: 'Failed to update score.' };
  }
}

export async function removePlayer(firestore: Firestore, playerId: string): Promise<{ success: boolean; error?: string }> {
  if (!playerId) {
    return { success: false, error: 'Player ID is required.' };
  }

  try {
    deleteDocumentNonBlocking(doc(firestore, 'players', playerId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting player: ", error);
    return { success: false, error: 'Failed to delete player.' };
  }
}
