// src/ads/networks/monetag.js

let monetagInstance = null;
let isInitialized = false;
let config = null;

/**
 * Initialize Monetag SDK
 * @param {Object} adsConfig - Configuration object with publisherId
 */
export function initialize(adsConfig) {
  if (isInitialized || !adsConfig.publisherId) {
    return;
  }

  config = adsConfig;

  try {
    // Check if Monetag SDK is loaded
    if (typeof window.monetag === "undefined") {
      console.error('Monetag SDK not found. Make sure the script is loaded in index.html');
      return;
    }

    // Initialize Monetag instance
    monetagInstance = window.monetag.init({
      publisherId: config.publisherId,
      debug: import.meta.env.DEV, // Enable debug in development
    });
    
    isInitialized = true;
    console.log('Monetag initialized successfully with publisher ID:', config.publisherId);
  } catch (error) {
    console.error('Failed to initialize Monetag:', error);
  }
}

/**
 * Show rewarded ad
 * @param {Object} handlers - Event handlers
 */
export function showAd({ onComplete, onClose, onError }) {
  if (!isInitialized || !monetagInstance) {
    if (onError) onError('Monetag not initialized. Please check your configuration.');
    return;
  }

  try {
    console.log('Showing Monetag ad...');
    
    monetagInstance.showRewardedAd({
      onReward: () => {
        // Ad completed successfully and user should be rewarded
        console.log('Monetag ad completed successfully');
        if (onComplete) onComplete();
      },
      onClose: () => {
        // Ad was closed (may or may not have been completed)
        console.log('Monetag ad closed');
        if (onClose) onClose();
      },
      onError: (error) => {
        console.error('Monetag ad error:', error);
        
        // Handle specific Monetag errors
        let errorMessage = 'Failed to show ad';
        
        if (error.code === 'NO_ADS') {
          errorMessage = 'No ads available right now.';
        } else if (error.code === 'NETWORK_ERROR') {
          errorMessage = 'Network error. Please check your connection.';
        } else if (error.code === 'AD_BLOCKED') {
          errorMessage = 'Ad blocker detected. Please disable it to watch ads.';
        } else {
          errorMessage = `Monetag error: ${error.message || 'Unknown error'}`;
        }
        
        if (onError) onError(errorMessage);
      }
    });
  } catch (error) {
    console.error('Monetag show error:', error);
    if (onError) onError('Failed to show Monetag ad');
  }
}

/**
 * Check if Monetag is available
 */
export function isAvailable() {
  return typeof window.monetag !== "undefined" && 
         isInitialized && 
         monetagInstance !== null;
}

/**
 * Get Monetag status for debugging
 */
export function getStatus() {
  return {
    sdkLoaded: typeof window.monetag !== "undefined",
    initialized: isInitialized,
    instanceReady: monetagInstance !== null,
    publisherId: config?.publisherId ? '***' + config.publisherId.slice(-4) : 'Not set'
  };
}
