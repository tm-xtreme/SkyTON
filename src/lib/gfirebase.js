// src/lib/gfirebase.js

import { getApps, getApp, initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc, increment } from "firebase/firestore";
import firebaseConfig from "@/firebaseConfig";

// Use existing Firebase app if already initialized
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

// Game-specific Firestore operations
export const getUserEnergy = async (userId) => {
  if (!userId) return 0;
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    return userDoc.exists() ? userDoc.data().energy || 0 : 0;
  } catch (error) {
    console.error("Error fetching user energy:", error);
    return 0;
  }
};

export const updateUserEnergy = async (userId, amount) => {
  if (!userId) return false;
  try {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      energy: increment(amount),
    });
    return true;
  } catch (error) {
    console.error("Error updating user energy:", error);
    return false;
  }
};

export { db };
