// src/ads/networks/adsgram.js

let adsgramInstance = null;
let isInitialized = false;
let config = null;

/**
 * Initialize Adsgram SDK
 * @param {Object} adsConfig - Configuration object with blockId
 */
export function initialize(adsConfig) {
  if (isInitialized || !adsConfig.blockId) {
    return;
  }

  config = adsConfig;

  try {
    // Check if Adsgram SDK is loaded
    if (typeof window.Adsgram === "undefined") {
      console.error('Adsgram SDK not found. Make sure the script is loaded in index.html');
      return;
    }

    // Initialize Adsgram instance
    adsgramInstance = window.Adsgram.init({
      blockId: config.blockId,
      debug: import.meta.env.DEV, // Enable debug in development
    });
    
    isInitialized = true;
    console.log('Adsgram initialized successfully with block ID:', config.blockId);
  } catch (error) {
    console.error('Failed to initialize Adsgram:', error);
  }
}

/**
 * Show rewarded ad
 * @param {Object} handlers - Event handlers
 */
export function showAd({ onComplete, onClose, onError }) {
  if (!isInitialized || !adsgramInstance) {
    if (onError) onError('Adsgram not initialized. Please check your configuration.');
    return;
  }

  try {
    console.log('Showing Adsgram ad...');
    
    adsgramInstance.show().then(() => {
      // Ad completed successfully
      console.log('Adsgram ad completed successfully');
      if (onComplete) onComplete();
    }).catch((error) => {
      console.error('Adsgram ad error:', error);
      
      // Handle specific Adsgram errors
      let errorMessage = 'Failed to show ad';
      
      if (error.message === 'AdBlock') {
        errorMessage = 'Ad blocker detected. Please disable it to watch ads.';
      } else if (error.message === 'NotReady') {
        errorMessage = 'Ad not ready. Please try again in a moment.';
      } else if (error.message === 'NotAllowed') {
        errorMessage = 'Ads not allowed in this context.';
      } else if (error.message === 'NoAds') {
        errorMessage = 'No ads available right now.';
      } else {
        errorMessage = `Adsgram error: ${error.message || 'Unknown error'}`;
      }
      
      if (onError) onError(errorMessage);
    });
  } catch (error) {
    console.error('Adsgram show error:', error);
    if (onError) onError('Failed to show Adsgram ad');
  }
}

/**
 * Check if Adsgram is available
 */
export function isAvailable() {
  return typeof window.Adsgram !== "undefined" && 
         isInitialized && 
         adsgramInstance !== null;
}

/**
 * Get Adsgram status for debugging
 */
export function getStatus() {
  return {
    sdkLoaded: typeof window.Adsgram !== "undefined",
    initialized: isInitialized,
    instanceReady: adsgramInstance !== null,
    blockId: config?.blockId ? '***' + config.blockId.slice(-4) : 'Not set'
  };
}
