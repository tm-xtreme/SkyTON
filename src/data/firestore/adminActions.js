import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  query,
  orderBy
} from "firebase/firestore";
import {
  updateUser,
  completeTaskForUser,
  rejectManualVerificationForUser
} from '@/data/firestore/userActions';

// Fetch all users, ordered by join date
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

// Toggle ban status for a user
export const setUserBanStatus = async (userId, isBanned) => {
  try {
    await updateUser(userId, { isBanned });
    console.log(`User ${userId} ban status set to: ${isBanned}`);
    return true;
  } catch (error) {
    console.error(`Error updating ban status for user ${userId}:`, error);
    return false;
  }
};

// Toggle admin status for a user
export const setUserAdminStatus = async (userId, isAdmin) => {
  try {
    await updateUser(userId, { isAdmin });
    console.log(`User ${userId} admin status set to: ${isAdmin}`);
    return true;
  } catch (error) {
    console.error(`Error updating admin status for user ${userId}:`, error);
    return false;
  }
};

// Fetches all users with pending manual tasks
export const getPendingVerifications = async () => {
  const usersColRef = collection(db, "users");
  try {
    const snapshot = await getDocs(query(usersColRef));
    const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const pendingItems = [];

    for (const user of allUsers) {
      if (Array.isArray(user.pendingVerificationTasks) && user.pendingVerificationTasks.length > 0) {
        for (const taskId of user.pendingVerificationTasks) {
          // --- NEW: Get details from pendingVerificationDetails if present ---
          const details = user.pendingVerificationDetails?.[taskId] || {};
          pendingItems.push({
            userId: user.id,
            username: user.username || user.firstName || `User ${user.id}`,
            taskId,
            title: details.title || undefined,
            target: details.target || undefined,
            reward: details.reward || undefined
          });
        }
      }
    }

    return pendingItems;
  } catch (error) {
    console.error("Error fetching pending verifications:", error);
    return [];
  }
};

// Approve a task (mark it complete and reward user)
export const approveTask = async (userId, taskId) => {
  return await completeTaskForUser(userId, taskId);
};

// Reject a task (remove it from pending list)
export const rejectTask = async (userId, taskId) => {
  return await rejectManualVerificationForUser(userId, taskId);
};
