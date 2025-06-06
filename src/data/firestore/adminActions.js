import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  getDoc,
  increment,
  serverTimestamp
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
            title: details.title || '',
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

// ==================== WITHDRAWAL FUNCTIONS ====================

// Get all pending withdrawal requests
export const getPendingWithdrawals = async () => {
  try {
    console.log('Fetching pending withdrawals...'); // Debug log
    const withdrawalsRef = collection(db, 'withdrawals');
    
    // First, let's try to get all documents to see what's there
    const allDocsQuery = query(withdrawalsRef);
    const allDocsSnapshot = await getDocs(allDocsQuery);
    
    console.log('Total withdrawal documents found:', allDocsSnapshot.size); // Debug log
    
    // Log all documents to see their structure
    allDocsSnapshot.forEach((doc) => {
      console.log('Document ID:', doc.id, 'Data:', doc.data());
    });
    
    // Now try the specific query for pending withdrawals
    const q = query(withdrawalsRef, where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const withdrawals = [];
    querySnapshot.forEach((doc) => {
      withdrawals.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log('getPendingWithdrawals result:', withdrawals); // Debug log
    return withdrawals;
  } catch (error) {
    console.error('Error fetching pending withdrawals:', error);
    
    // If the orderBy query fails, try without orderBy
    try {
      console.log('Retrying without orderBy...');
      const withdrawalsRef = collection(db, 'withdrawals');
      const q = query(withdrawalsRef, where('status', '==', 'pending'));
      const querySnapshot = await getDocs(q);
      
      const withdrawals = [];
      querySnapshot.forEach((doc) => {
        withdrawals.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log('getPendingWithdrawals result (without orderBy):', withdrawals);
      return withdrawals;
    } catch (retryError) {
      console.error('Error in retry attempt:', retryError);
      return [];
    }
  }
};

// Approve a withdrawal request
export const approveWithdrawal = async (withdrawalId, userId, amount) => {
  try {
    console.log(`Approving withdrawal: ${withdrawalId} for user: ${userId}, amount: ${amount}`);
    
    // Update withdrawal status
    const withdrawalRef = doc(db, 'withdrawals', withdrawalId);
    await updateDoc(withdrawalRef, {
      status: 'approved',
      approvedAt: serverTimestamp(),
      processedBy: 'admin'
    });

    // Deduct amount from user's balance
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      balance: increment(-parseFloat(amount))
    });

    // Send notification to admin (optional)
    try {
      const withdrawalDoc = await getDoc(withdrawalRef);
      const withdrawalData = withdrawalDoc.data();
      
      await fetch(`https://api.telegram.org/bot${import.meta.env.VITE_TG_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: '5063003944', // Admin chat ID
          text: `✅ <b>Withdrawal Approved</b>\nUser: ${withdrawalData.username || withdrawalData.userId}\nAmount: ${amount} STON\nWallet: ${withdrawalData.walletAddress}`,
          parse_mode: 'HTML'
        })
      });
    } catch (notificationError) {
      console.error('Failed to send approval notification:', notificationError);
    }

    console.log(`Withdrawal ${withdrawalId} approved for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error approving withdrawal:', error);
    return false;
  }
};

// Reject a withdrawal request
export const rejectWithdrawal = async (withdrawalId) => {
  try {
    console.log(`Rejecting withdrawal: ${withdrawalId}`);
    
    // Update withdrawal status
    const withdrawalRef = doc(db, 'withdrawals', withdrawalId);
    await updateDoc(withdrawalRef, {
      status: 'rejected',
      rejectedAt: serverTimestamp(),
      processedBy: 'admin'
    });

    // Send notification to admin (optional)
    try {
      const withdrawalDoc = await getDoc(withdrawalRef);
      const withdrawalData = withdrawalDoc.data();
      
      await fetch(`https://api.telegram.org/bot${import.meta.env.VITE_TG_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: '5063003944', // Admin chat ID
          text: `❌ <b>Withdrawal Rejected</b>\nUser: ${withdrawalData.username || withdrawalData.userId}\nAmount: ${withdrawalData.amount} STON\nReason: Admin decision`,
          parse_mode: 'HTML'
        })
      });
    } catch (notificationError) {
      console.error('Failed to send rejection notification:', notificationError);
    }

    console.log(`Withdrawal ${withdrawalId} rejected`);
    return true;
  } catch (error) {
    console.error('Error rejecting withdrawal:', error);
    return false;
  }
};

// Create a withdrawal request (to be used in ProfileSection)
export const createWithdrawalRequest = async (userId, amount, walletAddress, userBalance, username) => {
  try {
    console.log(`Creating withdrawal request for user ${userId}, amount: ${amount} STON`);
    
    const withdrawalsRef = collection(db, 'withdrawals');
    const docRef = await addDoc(withdrawalsRef, {
      userId: userId.toString(), // Ensure userId is a string
      username: username || null,
      amount: parseFloat(amount),
      walletAddress,
      userBalance: userBalance || 0,
      status: 'pending',
      createdAt: serverTimestamp()
    });
    
    console.log(`Withdrawal request created with ID: ${docRef.id} for user ${userId}, amount: ${amount} STON`);
    return true;
  } catch (error) {
    console.error('Error creating withdrawal request:', error);
    return false;
  }
};

// Get withdrawal history for a specific user
export const getUserWithdrawalHistory = async (userId) => {
  try {
    console.log(`Fetching withdrawal history for user: ${userId}`);
    
    const withdrawalsRef = collection(db, 'withdrawals');
    
    // First, let's try to get all documents for this user to see what's there
    const allUserDocsQuery = query(withdrawalsRef, where('userId', '==', userId.toString()));
    const allUserDocsSnapshot = await getDocs(allUserDocsQuery);
    
    console.log(`Total withdrawal documents found for user ${userId}:`, allUserDocsSnapshot.size);
    
    // Log all documents to see their structure
    allUserDocsSnapshot.forEach((doc) => {
      console.log('User withdrawal document ID:', doc.id, 'Data:', doc.data());
    });
    
    // Now try the specific query with orderBy
    try {
      const q = query(withdrawalsRef, where('userId', '==', userId.toString()), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const withdrawals = [];
      querySnapshot.forEach((doc) => {
        withdrawals.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log('getUserWithdrawalHistory result:', withdrawals);
      return withdrawals;
    } catch (orderByError) {
      console.log('OrderBy failed, trying without orderBy...');
      
      // If orderBy fails, return the results without ordering
      const withdrawals = [];
      allUserDocsSnapshot.forEach((doc) => {
        withdrawals.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Sort manually by createdAt
      withdrawals.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
      
      console.log('getUserWithdrawalHistory result (manual sort):', withdrawals);
      return withdrawals;
    }
  } catch (error) {
    console.error('Error fetching user withdrawal history:', error);
    return [];
  }
};
