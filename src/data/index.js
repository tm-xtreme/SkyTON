import React from 'react';

// Re-exporting functions from the new Firestore-based stores
export { initializeAppData } from '@/data/storeInitialization';

// Export functions from specific store files
export * from '@/data/userStore';
export * from '@/data/taskStore';
export * from '@/data/adminStore';
export * from '@/data/leaderboardStore'; // This now exports getLeaderboardData

// Export specific action modules if direct access is needed (optional)
// export * as userActions from '@/data/firestore/userActions';
// export * as taskActions from '@/data/firestore/taskActions';
// export * as adminActions from '@/data/firestore/adminActions';
// export * as leaderboardActions from '@/data/firestore/leaderboardActions';
// export * as initActions from '@/data/firestore/initActions';

// Export defaults and telegram utils
export * from '@/data/defaults';
export * from '@/data/telegramUtils';
