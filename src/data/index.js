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

// Optionally, you can keep these commented if you plan to use specific actions separately
// export * as userActions from '@/data/firestore/userActions';
// export * as taskActions from '@/data/firestore/taskActions';
// export * as adminActions from '@/data/firestore/adminActions';
// export * as leaderboardActions from '@/data/firestore/leaderboardActions';
// export * as initActions from '@/data/firestore/initActions';
