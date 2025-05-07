
import React from 'react';
import { db } from '@/lib/firebase';
import {
  doc, getDoc, setDoc, updateDoc, writeBatch,
  serverTimestamp, increment, arrayUnion, arrayRemove, Timestamp
} from "firebase/firestore";
import { defaultFirestoreUser } from '@/data/defaults';
import { generateReferralLink } from '@/data/telegramUtils';
import { getTask } from '@/data/firestore/taskActions'; // Import from new location

// Fetches user data or creates a new user if they don't exist
export const getOrCreateUser = async (telegramUserData) => {
  if (!telegramUserData || !telegramUserData.id) {
    console.error("Missing Telegram data.");
    return null;
  }

  const userId = telegramUserData.id;
  const userRef = doc(db, "users", userId);

  try {
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const existingData = userSnap.data();
      const updates = {};

      // Auto-generate referral link if missing
      if (!existingData.referralLink || !existingData.referralLink.includes('?u=')) {
        updates.referralLink = generateReferralLink(userId);
      }

      // Update Telegram fields if changed
      if (telegramUserData.username && existingData.username !== telegramUserData.username)
        updates.username = telegramUserData.username;
      if (telegramUserData.firstName && existingData.firstName !== telegramUserData.firstName)
        updates.firstName = telegramUserData.firstName;
      if (telegramUserData.lastName && existingData.lastName !== telegramUserData.lastName)
        updates.lastName = telegramUserData.lastName;
      if (telegramUserData.profilePicUrl && existingData.profilePicUrl !== telegramUserData.profilePicUrl)
        updates.profilePicUrl = telegramUserData.profilePicUrl;

      if (Object.keys(updates).length > 0) {
        await updateDoc(userRef, updates);
        console.log("User profile updated from Telegram data.");
        return { id: userId, ...existingData, ...updates };
      }

      return { id: userId, ...existingData };
    } else {
      const newUser = defaultFirestoreUser(
        userId,
        telegramUserData.username,
        telegramUserData.firstName,
        telegramUserData.lastName,
        null
      );
      newUser.profilePicUrl = telegramUserData.profilePicUrl;
      newUser.referralLink = generateReferralLink(userId);

      await setDoc(userRef, { ...newUser, joinedAt: serverTimestamp() });
      console.log("New user created from WebApp.");
      return { id: userId, ...newUser };
    }
  } catch (error) {
    console.error("Error in getOrCreateUser:", error);
    return null;
  }
};

// Update specific user fields
export const updateUser = async (userId, updates) => {
  if (!userId) {
    console.error("User ID required for update.");
    return false;
  }
  const userRef = doc(db, "users", userId);
  try {
    await updateDoc(userRef, updates);
    console.log(`User ${userId} updated successfully.`);
    return true;
  } catch (error) {
    console.error(`Error updating user ${userId}:`, error);
    return false;
  }
};

// Fetch a single user by ID (read-only)
export const getUser = async (userId) => {
  if (!userId) return null;
  const userRef = doc(db, "users", userId);
  try {
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } : null;
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    return null;
  }
}

// Marks a task as completed for a user and adds reward
export const completeTaskForUser = async (userId, taskId) => {
    if (!userId || !taskId) return false;

    const userRef = doc(db, "users", userId);
    const task = await getTask(taskId);

    if (!task) {
        console.error(`Task ${taskId} definition not found.`);
        return false;
    }

    const taskUpdateKey = `tasks.${taskId}`;
    const reward = task.reward || 0;

    try {
        const userSnap = await getDoc(userRef);
        if (userSnap.exists() && userSnap.data().tasks?.[taskId]) {
            console.log(`Task ${taskId} already completed for user ${userId}.`);
            return true;
        }

        await updateDoc(userRef, {
            [taskUpdateKey]: true,
            balance: increment(reward),
            pendingVerificationTasks: arrayRemove(taskId)
        });
        console.log(`Task ${taskId} completed for user ${userId}, balance updated.`);
        return true;
    } catch (error) {
        console.error(`Error completing task ${taskId} for user ${userId}:`, error);
        return false;
    }
};

// Adds a task to user's pending verification list
export const requestManualVerificationForUser = async (userId, taskId) => {
    if (!userId || !taskId) return false;
    const userRef = doc(db, "users", userId);
    try {
         const userSnap = await getDoc(userRef);
         if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData.tasks?.[taskId]) {
                console.log(`Task ${taskId} already completed for user ${userId}. Cannot request verification.`);
                return false;
            }
            if (userData.pendingVerificationTasks?.includes(taskId)) {
                console.log(`Task ${taskId} already pending verification for user ${userId}.`);
                return true;
            }
         }

        await updateDoc(userRef, {
            pendingVerificationTasks: arrayUnion(taskId)
        });
        console.log(`Task ${taskId} added to pending verification for user ${userId}.`);
        return true;
    } catch (error) {
        console.error(`Error requesting verification for task ${taskId} for user ${userId}:`, error);
        return false;
    }
};

// Removes a task from user's pending verification list (Admin Reject)
export const rejectManualVerificationForUser = async (userId, taskId) => {
    if (!userId || !taskId) return false;
    const userRef = doc(db, "users", userId);
    try {
        await updateDoc(userRef, {
            pendingVerificationTasks: arrayRemove(taskId)
        });
        console.log(`Task ${taskId} rejected (removed from pending) for user ${userId}.`);
        return true;
    } catch (error) {
        console.error(`Error rejecting verification for task ${taskId} for user ${userId}:`, error);
        return false;
    }
};

// Performs daily check-in
export const performCheckInForUser = async (userId) => {
    if (!userId) return { success: false, message: 'User ID required.' };

    const userRef = doc(db, "users", userId);
    const checkInTaskId = 'task_daily_checkin';
    const task = await getTask(checkInTaskId);
    const reward = task ? task.reward : 0;

    try {
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return { success: false, message: 'User not found.' };

        const userData = userSnap.data();
        const lastCheckIn = userData.lastCheckIn;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let canCheckIn = true;
        if (lastCheckIn && lastCheckIn instanceof Timestamp) {
            const lastCheckInDate = lastCheckIn.toDate();
            lastCheckInDate.setHours(0, 0, 0, 0);
            if (lastCheckInDate.getTime() === today.getTime()) {
                canCheckIn = false;
            }
        } else if (lastCheckIn) {
             console.warn("lastCheckIn is not a Firestore Timestamp:", lastCheckIn);
             canCheckIn = true;
        }

        if (canCheckIn) {
            const taskUpdateKey = `tasks.${checkInTaskId}`;
            await updateDoc(userRef, {
                balance: increment(reward),
                lastCheckIn: serverTimestamp(),
                [taskUpdateKey]: true
            });
            console.log(`User ${userId} checked in successfully.`);
            return { success: true, reward: reward };
        } else {
            console.log(`User ${userId} already checked in today.`);
            return { success: false, message: 'Already checked in today.' };
        }

    } catch (error) {
        console.error(`Error during check-in for user ${userId}:`, error);
        return { success: false, message: 'An error occurred.' };
    }
};
  
