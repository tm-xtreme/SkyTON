
import React from 'react';
import { getOrCreateUser } from '@/data/firestore/userActions'; // Updated import path
import { seedInitialTasks } from '@/data/firestore/initActions'; // Updated import path
import { parseLaunchParams } from '@/data/telegramUtils';
import { defaultFirestoreTasks } from '@/data/defaults';

export const initializeAppData = async () => {
  console.log("Initializing App Data...");
  const { telegramUser, referrerId } = parseLaunchParams();

  await seedInitialTasks(defaultFirestoreTasks);

  if (!telegramUser) {
    console.warn("No Telegram user data found in URL. App might not function correctly.");
    return null;
  }

  const userData = await getOrCreateUser(telegramUser, referrerId);

  if (!userData) {
    console.error("Failed to get or create user in Firestore.");
    return null;
  }

  console.log("App data initialized. User:", userData.id); // Use userData.id (document ID)
  return userData;
};
  