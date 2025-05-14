// src/data/storeInitialization.js
import { getOrCreateUser, getUserById } from '@/data/firestore/userActions';
import { seedInitialTasks } from '@/data/firestore/initActions';
import { parseLaunchParams } from '@/data/telegramUtils';
import { defaultFirestoreTasks } from '@/data/defaults';

export const initializeAppData = async () => {
  console.log("Initializing App Data...");
  const { telegramUser, referrerId } = parseLaunchParams();

  await seedInitialTasks(defaultFirestoreTasks);

  if (telegramUser) {
    const userData = await getOrCreateUser(telegramUser, referrerId);
    if (userData) {
      sessionStorage.setItem('userId', userData.id);
      return userData;
    } else {
      console.error("Failed to get or create user from Telegram WebApp data.");
      return null;
    }
  }

  // Fallback if user ID was previously saved
  const storedId = sessionStorage.getItem('userId');
  if (storedId) {
    const existingUser = await getUserById(storedId);
    if (existingUser) {
      console.log("Loaded user from stored session ID:", storedId);
      return { id: storedId, ...existingUser };
    }
  }

  console.warn("No Telegram user or stored user ID. Returning test user.");
  return {
    id: 'test_user',
    name: 'Test User',
    isAdmin: true
  };
};
