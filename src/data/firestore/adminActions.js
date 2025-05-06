
import React from 'react';
import { db } from '@/lib/firebase';
import {
  doc, updateDoc, collection, getDocs, query, orderBy
} from "firebase/firestore";
import { updateUser } from '@/data/firestore/userActions'; // Import from new location

// Fetches all users
export const getAllUsers = async () => {
  const usersColRef = collection(db, "users");
  try {
    const q = query(usersColRef, orderBy("joinedAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching all users:", error);
    return [];
  }
};

// Bans or unbans a user
export const setUserBanStatus = async (userId, isBanned) => {
  return await updateUser(userId, { isBanned: isBanned });
};

// Sets admin status
export const setUserAdminStatus = async (userId, isAdmin) => {
   return await updateUser(userId, { isAdmin: isAdmin });
};
  