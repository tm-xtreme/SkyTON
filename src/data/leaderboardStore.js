
import React from 'react';
import { getLeaderboard } from '@/data/firestore/leaderboardActions'; // Updated import path

// Fetches the leaderboard data from Firestore
export const getLeaderboardData = async (count = 10) => {
  return await getLeaderboard(count);
};
  