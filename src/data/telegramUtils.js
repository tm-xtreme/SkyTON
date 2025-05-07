import React from 'react';

// Parses Telegram Web App data AND referral parameter 'userId'
export const parseLaunchParams = () => {
  const hash = window.location.hash.slice(1);
  if (!hash) {
    return { telegramUser: null, referrerId: null };
  }

  const params = new URLSearchParams(hash);
  const tgWebAppData = params.get('tgWebAppData');
  const referrerId = params.get('userId'); // Get referrer ID from 'userId' param

  let telegramUser = null;

  if (tgWebAppData) {
    try {
      const dataParams = new URLSearchParams(tgWebAppData);
      const userParam = dataParams.get('user');

      if (userParam) {
        const userData = JSON.parse(decodeURIComponent(userParam));
        // Extract first/last names
        const firstName = userData.first_name || '';
        const lastName = userData.last_name || '';

        telegramUser = {
          id: String(userData.id), // Ensure ID is a string
          username: userData.username || null, // Use null if undefined
          firstName: firstName,
          lastName: lastName,
          fullName: `${firstName} ${lastName}`.trim(), // Keep fullName for display convenience
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

// Generates a referral link for the given user ID
const generateReferralLink = (userId) => {
    if (!userId) return '';
    return `http://t.me/xSkyTON_Bot?start=User_${userId}`;
};
