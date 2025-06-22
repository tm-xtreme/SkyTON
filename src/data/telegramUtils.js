import React from 'react';
// Parses Telegram Web App data AND referral parameter 'u'
export const parseLaunchParams = () => {
  let hash = window.location.hash.slice(1);

  // Fallback: If no hash, try to get from sessionStorage only
  if (!hash) {
    hash = sessionStorage.getItem('tgWebAppHash') || '';
  }

  let params = null;
  if (hash) {
    params = new URLSearchParams(hash);
  } else {
    // Final fallback: try raw tgWebAppData from sessionStorage
    const tgWebAppDataRaw = sessionStorage.getItem('tgWebAppDataRaw');
    if (tgWebAppDataRaw) {
      params = new URLSearchParams();
      params.set('tgWebAppData', tgWebAppDataRaw);
    }
  }

  if (!params) {
    return { telegramUser: null, referrerId: null };
  }

  const tgWebAppData = params.get('tgWebAppData');

  let telegramUser = null;
  let referrerId = null;

  if (tgWebAppData) {
    try {
      // Persist for future reloads/reopens (sessionStorage only)
      sessionStorage.setItem('tgWebAppHash', hash);
      sessionStorage.setItem('tgWebAppDataRaw', tgWebAppData);

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

        // Also store userId for app-wide restoration (sessionStorage only)
        sessionStorage.setItem('userId', telegramUser.id);
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
  sessionStorage.removeItem('tgWebAppDataRaw');
  sessionStorage.removeItem('userId');
};

export const generateReferralLink = (userId) => {
  if (!userId) return '';
  return `http://t.me/xSkyTON_Bot?start=User_${userId}`;
};
