// src/data/index.js

import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

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
