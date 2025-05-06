// src/data/storeInitialization.js

export const initializeAppData = async () => {
  console.log("Running in test mode with dummy user...");

  // Return dummy user data to test if app renders correctly
  return {
    id: 'test_user',
    name: 'Test User',
    isAdmin: true
  };
};
