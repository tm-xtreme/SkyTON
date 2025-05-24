
import React from 'react';
// No more localStorage keys

// Default structure for a NEW user document in Firestore
export const defaultFirestoreUser = (telegramId, username, firstName, lastName, invitedBy = null) => ({
  telegramId: telegramId,
  username: username || `user_${telegramId}`, // Fallback username
  firstName: firstName || '',
  lastName: lastName || '',
  joinedAt: null, // Will be set to serverTimestamp() by Firestore
  wallet: null,
  balance: 100,
  energy: 1000, // Default energy
  referrals: 0,
  referralCode: telegramId, // User's own ID is their code
  invitedBy: invitedBy, // ID of the user who referred them
  tasks: {}, // Key: task document ID, Value: boolean (completed)
  pendingVerificationTasks: [], // Array of task document IDs pending manual verification
  lastCheckIn: null, // Timestamp of last check-in
  isBanned: false,
  isAdmin: false,
  profilePicUrl: null, // Will be populated from Telegram data if available
});

// Default structure for a Task document in Firestore
export const defaultFirestoreTasks = [
  { id: 'task_join_channel', title: 'Join SkyTON Channel', description: 'Join our main announcement channel.', reward: 500, type: 'telegram_join', target: '@xSkyTON', active: true, verificationType: 'auto' },
  { id: 'task_join_group', title: 'Join SkyTON Community Group', description: 'Join our community discussion group.', reward: 500, type: 'telegram_join', target: '@cSkyTON', active: true, verificationType: 'auto' },
  { id: 'task_follow_twitter', title: 'Follow on Twitter', description: 'Follow our official Twitter account.', reward: 100, type: 'twitter_follow', target: '@MockSkyTONTwitter', active: true, verificationType: 'manual' },
  { id: 'task_visit_website', title: 'Visit Website', description: 'Visit our landing page.', reward: 50, type: 'visit_site', target: 'https://example-skyton.com', active: true, verificationType: 'auto' },
  { id: 'task_daily_checkin', title: 'Daily Check-in', description: 'Check in daily for a bonus.', reward: 25, type: 'daily_checkin', target: null, active: true, verificationType: 'auto' },
  { id: 'task_refer_friend', title: 'Refer a Friend', description: 'Invite friends to earn more STON.', reward: 100, type: 'referral', target: null, active: true, verificationType: 'auto' },
  { id: 'task_manual_check', title: 'Manual Check Task', description: 'Example task requiring manual check.', reward: 300, type: 'telegram_join', target: '@ManualCheckChannel', active: true, verificationType: 'manual' },
];
  
