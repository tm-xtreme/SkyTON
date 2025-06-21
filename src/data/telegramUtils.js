import React from 'react';

// Parses Telegram Web App data AND referral parameter 'u'
export const parseLaunchParams = () => {
  let hash = window.location.hash.slice(1);

  // Fallback: If no hash, try to get from sessionStorage
  if (!hash) {
    hash = sessionStorage.getItem('tgWebAppHash') || '';
  }

  if (!hash) {
    return { telegramUser: null, referrerId: null };
  }

  const params = new URLSearchParams(hash);
  const tgWebAppData = params.get('tgWebAppData');

  let telegramUser = null;
  let referrerId = null;

  if (tgWebAppData) {
    try {
      // Persist the hash for future reloads
      sessionStorage.setItem('tgWebAppHash', window.location.hash.slice(1));
      const dataParams = new URLSearchParams(tgWebAppData);
      const userParam = dataParams.get('user');

      if (userParam) {
        const userData = JSON.parse(decodeURIComponent(userParam));
        const firstName = userData.first_name || '';
        const lastName = userData.last_name || '';
        referrerId = String(userData.id);

        telegramUser = {
          id: String(userData.id),
          username: userData.username || null,
          firstName: firstName,
          lastName: lastName,
          fullName: `${firstName} ${lastName}`.trim(),
          profilePicUrl: userData.photo_url || null,
        };
      }
    } catch (error) {
      console.error("Error parsing Telegram Web App data:", error);
      telegramUser = null;
    }
  }

  return { telegramUser, referrerId };
};

// You may want to clear session on logout
export const clearTelegramSession = () => {
  sessionStorage.removeItem('tgWebAppHash');
};

export const generateReferralLink = (userId) => {
  if (!userId) return '';
  return `http://t.me/xSkyTON_Bot?start=User_${userId}`;
};
