'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, increment, deleteDoc } from 'firebase/firestore';

export async function addPlayer(name: string): Promise<{ success: boolean; error?: string }> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return { success: false, error: 'Player name cannot be empty.' };
  }

  try {
    const playersRef = collection(db, 'players');
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
  } catch (error) {
    console.error("Error adding player: ", error);
    return { success: false, error: 'Failed to add player. Check server logs and Firebase setup.' };
  }
}

export async function updatePlayerScore(playerId: string, change: 1 | -1): Promise<{ success: boolean; error?: string }> {
  if (!playerId) {
    return { success: false, error: 'Player ID is required.' };
  }

  try {
    const playerDocRef = doc(db, 'players', playerId);
    await updateDoc(playerDocRef, {
      score: increment(change),
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating score: ", error);
    return { success: false, error: 'Failed to update score.' };
  }
}

export async function removePlayer(playerId: string): Promise<{ success: boolean; error?: string }> {
  if (!playerId) {
    return { success: false, error: 'Player ID is required.' };
  }

  try {
    await deleteDoc(doc(db, 'players', playerId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting player: ", error);
    return { success: false, error: 'Failed to delete player.' };
  }
}
