import React from 'react';
import { getOrCreateUser } from '@/data/firestore/userActions'; // Updated import path
import { seedInitialTasks } from '@/data/firestore/initActions'; // Updated import path
import { parseLaunchParams } from '@/data/telegramUtils';
import { defaultFirestoreTasks } from '@/data/defaults';

export const initializeAppData = async () => {
  console.log("Initializing App Data...");
  const { telegramUser, referrerId } = parseLaunchParams();

  await seedInitialTasks(defaultFirestoreTasks);

  // Allow fallback for dev/test mode
  if (!telegramUser) {
    console.warn("No Telegram user data found in URL. Using dummy user for dev/test.");
    return null/*{
      id: 'test_user',
      name: 'Test User',
      isAdmin: true, // or false if you want to test as a regular user
    };*
  }

  const userData = await getOrCreateUser(telegramUser, referrerId);

  if (!userData) {
    console.error("Failed to get or create user in Firestore.");
    return null;
  }

  console.log("App data initialized. User:", userData.id);
  return userData;
};
