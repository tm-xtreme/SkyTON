// /data/storeInitialization.js
import { getOrCreateUser } from '@/data/firestore/userActions';
import { seedInitialTasks } from '@/data/firestore/initActions';
import { parseLaunchParams } from '@/data/telegramUtils';
import { defaultFirestoreTasks } from '@/data/defaults';

export const initializeAppData = async () => {
  console.log('Initializing App Data...');
  const { telegramUser, referrerId, isTelegram } = parseLaunchParams();

  await seedInitialTasks(defaultFirestoreTasks);

  // Allow fallback for dev/test mode
  if (!isTelegram) {
    console.warn('Non-Telegram user trying to access the app.');
    return { error: 'non-telegram' };
  }

  if (!telegramUser) {
    console.warn('No Telegram user data found in URL.');
    return null;
  }

  const userData = await getOrCreateUser(telegramUser, referrerId);

  if (!userData) {
    console.error('Failed to get or create user in Firestore.');
    return null;
  }

  console.log('App data initialized. User:', userData.id);
  return userData;
};
