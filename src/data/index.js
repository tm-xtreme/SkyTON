// src/data/index.js

import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit, doc, updateDoc, increment, getDoc } from 'firebase/firestore';

// Re-export initialization
export { initializeAppData } from '@/data/storeInitialization';

// Re-export all named exports from individual stores
export * from '@/data/userStore';
export * from '@/data/taskStore';
export * from '@/data/adminStore';
export * from '@/data/leaderboardStore';

// Re-export default values and Telegram utilities
export * from '@/data/defaults';
export * from '@/data/telegramUtils';

// Firestore function for leaderboard data
export const getLeaderboardData = async () => {
  try {
    const q = query(
      collection(db, 'users'),
      orderBy('referrals', 'desc'),
      limit(20)
    );

    const querySnapshot = await getDocs(q);
    const data = [];

    querySnapshot.forEach(doc => {
      const user = doc.data();
      data.push({
        id: doc.id,
        username: user.username || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        referrals: user.referrals || 0,
        profilePicUrl: user.profilePicUrl || null
      });
    });

    return data;
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    return [];
  }
};

// Function to update user energy
export const updateUserEnergy = async (userId, energyAmount) => {
  if (!userId || !energyAmount || energyAmount <= 0) {
    console.error('Invalid parameters for updateUserEnergy');
    return false;
  }

  try {
    const userRef = doc(db, 'users', userId);
    
    // Check if user exists first
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      console.error('User not found:', userId);
      return false;
    }

    // Update user energy using increment
    await updateDoc(userRef, {
      energy: increment(energyAmount),
      lastEnergyUpdate: new Date()
    });

    console.log(`Successfully added ${energyAmount} energy to user ${userId}`);
    return true;
  } catch (error) {
    console.error('Failed to update user energy:', error);
    return false;
  }
};

// Function to update user balance (if needed for other rewards)
export const updateUserBalance = async (userId, balanceAmount) => {
  if (!userId || !balanceAmount || balanceAmount <= 0) {
    console.error('Invalid parameters for updateUserBalance');
    return false;
  }

  try {
    const userRef = doc(db, 'users', userId);
    
    // Check if user exists first
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      console.error('User not found:', userId);
      return false;
    }

    // Update user balance using increment
    await updateDoc(userRef, {
      balance: increment(balanceAmount),
      lastBalanceUpdate: new Date()
    });

    console.log(`Successfully added ${balanceAmount} STON to user ${userId}`);
    return true;
  } catch (error) {
    console.error('Failed to update user balance:', error);
    return false;
  }
};

// Function to deduct user energy (for game usage)
export const deductUserEnergy = async (userId, energyAmount) => {
  if (!userId || !energyAmount || energyAmount <= 0) {
    console.error('Invalid parameters for deductUserEnergy');
    return false;
  }

  try {
    const userRef = doc(db, 'users', userId);
    
    // Check if user exists and has enough energy
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      console.error('User not found:', userId);
      return false;
    }

    const userData = userDoc.data();
    const currentEnergy = userData.energy || 0;

    if (currentEnergy < energyAmount) {
      console.error('Insufficient energy:', { current: currentEnergy, required: energyAmount });
      return false;
    }

    // Deduct energy using increment with negative value
    await updateDoc(userRef, {
      energy: increment(-energyAmount),
      lastEnergyUsed: new Date()
    });

    console.log(`Successfully deducted ${energyAmount} energy from user ${userId}`);
    return true;
  } catch (error) {
    console.error('Failed to deduct user energy:', error);
    return false;
  }
};

// Function to check user energy level
export const getUserEnergy = async (userId) => {
  if (!userId) {
    console.error('Invalid userId for getUserEnergy');
    return 0;
  }

  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error('User not found:', userId);
      return 0;
    }

    const userData = userDoc.data();
    return userData.energy || 0;
  } catch (error) {
    console.error('Failed to get user energy:', error);
    return 0;
  }
};

// Function to set maximum energy limit (optional)
export const setUserEnergyLimit = async (userId, maxEnergy = 100) => {
  if (!userId || maxEnergy <= 0) {
    console.error('Invalid parameters for setUserEnergyLimit');
    return false;
  }

  try {
    const userRef = doc(db, 'users', userId);
    
    // Check if user exists
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      console.error('User not found:', userId);
      return false;
    }

    const userData = userDoc.data();
    const currentEnergy = userData.energy || 0;

    // Only update if current energy exceeds the limit
    if (currentEnergy > maxEnergy) {
      await updateDoc(userRef, {
        energy: maxEnergy,
        maxEnergyLimit: maxEnergy,
        lastEnergyLimitUpdate: new Date()
      });
      console.log(`Energy capped at ${maxEnergy} for user ${userId}`);
    } else {
      await updateDoc(userRef, {
        maxEnergyLimit: maxEnergy,
        lastEnergyLimitUpdate: new Date()
      });
    }

    return true;
  } catch (error) {
    console.error('Failed to set user energy limit:', error);
    return false;
  }
};

// Function to reset daily energy (if you have daily limits)
export const resetDailyEnergy = async (userId, dailyEnergyAllowance = 50) => {
  if (!userId || dailyEnergyAllowance <= 0) {
    console.error('Invalid parameters for resetDailyEnergy');
    return false;
  }

  try {
    const userRef = doc(db, 'users', userId);
    
    // Check if user exists
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      console.error('User not found:', userId);
      return false;
    }

    await updateDoc(userRef, {
      energy: dailyEnergyAllowance,
      lastDailyEnergyReset: new Date(),
      dailyEnergyAllowance: dailyEnergyAllowance
    });

    console.log(`Daily energy reset to ${dailyEnergyAllowance} for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Failed to reset daily energy:', error);
    return false;
  }
};

// Function to log energy transactions (for analytics)
export const logEnergyTransaction = async (userId, type, amount, source = 'unknown') => {
  if (!userId || !type || !amount) {
    console.error('Invalid parameters for logEnergyTransaction');
    return false;
  }

  try {
    const transactionRef = collection(db, 'energyTransactions');
    await addDoc(transactionRef, {
      userId,
      type, // 'earned', 'spent', 'reset'
      amount,
      source, // 'ad', 'game', 'daily_reset', 'admin'
      timestamp: new Date(),
      createdAt: new Date()
    });

    console.log(`Energy transaction logged: ${type} ${amount} for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Failed to log energy transaction:', error);
    return false;
  }
};
