'use server';

import { collection, query, where, getDocs, doc, increment, addDoc, deleteDoc, updateDoc, Firestore } from 'firebase/firestore';

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

    await addDoc(playersRef, {
      name: trimmedName,
      score: 0,
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error adding player: ", error);
    return { success: false, error: error.message || 'Failed to add player.' };
  }
}

export async function updatePlayerScore(firestore: Firestore, playerId: string, change: 1 | -1): Promise<{ success: boolean; error?: string }> {
  if (!playerId) {
    return { success: false, error: 'Player ID is required.' };
  }

  try {
    const playerDocRef = doc(firestore, 'players', playerId);
    await updateDoc(playerDocRef, {
      score: increment(change),
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error updating score: ", error);
    return { success: false, error: error.message || 'Failed to update score.' };
  }
}

export async function removePlayer(firestore: Firestore, playerId: string): Promise<{ success: boolean; error?: string }> {
  if (!playerId) {
    return { success: false, error: 'Player ID is required.' };
  }

  try {
    await deleteDoc(doc(firestore, 'players', playerId));
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting player: ", error);
    return { success: false, error: error.message || 'Failed to delete player.' };
  }
}

    