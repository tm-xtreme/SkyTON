// src/ads/networks/monetag.js
let monetagInstance = null;
let isInitialized = false;
let config = null;

/**
 * Initialize Monetag SDK
 * @param {Object} adsConfig - Configuration object with zoneId
 */
export function initialize(adsConfig) {
  if (isInitialized || !adsConfig.zoneId) { // Changed from publisherId to zoneId
    console.log('Monetag initialization skipped:', { 
      isInitialized, 
      hasZoneId: !!adsConfig.zoneId 
    });
    return;
  }

  config = adsConfig;

  try {
    // Check if Monetag SDK is loaded
    if (typeof window.monetag === "undefined") { // Fixed: was === "" should be === "undefined"
      console.error('Monetag SDK not found. Make sure the script is loaded in index.html');
      return;
    }

    console.log('Initializing Monetag with zone ID:', config.zoneId);

    // Initialize Monetag instance
    monetagInstance = window.monetag.init({
      zoneId: config.zoneId, // Changed from publisherId to zoneId
      debug: import.meta.env.DEV, // Enable debug in development
    });
    
    isInitialized = true;
    console.log('Monetag initialized successfully with zone ID:', config.zoneId);
  } catch (error) {
    console.error('Failed to initialize Monetag:', error);
    isInitialized = false;
    monetagInstance = null;
  }
}

/**
 * Show rewarded ad
 * @param {Object} handlers - Event handlers
 */
export function showAd({ onComplete, onClose, onError }) {
  console.log('Monetag showAd called:', { 
    isInitialized, 
    hasInstance: !!monetagInstance 
  });

  if (!isInitialized || !monetagInstance) {
    const errorMsg = 'Monetag not initialized. Please check your zone ID configuration.';
    console.error(errorMsg);
    if (onError) onError(errorMsg);
    return;
  }

  try {
    console.log('Showing Monetag rewarded ad...');
    
    // Monetag rewarded video ad
    monetagInstance.showRewardedVideo({ // Changed from showRewardedAd to showRewardedVideo
      onReward: () => {
        // Ad completed successfully and user should be rewarded
        console.log('Monetag ad completed successfully - user rewarded');
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
        
        if (error && typeof error === 'object') {
          if (error.code === 'NO_ADS' || error.message?.includes('no ads')) {
            errorMessage = 'No ads available right now.';
          } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('network')) {
            errorMessage = 'Network error. Please check your connection.';
          } else if (error.code === 'AD_BLOCKED' || error.message?.includes('blocked')) {
            errorMessage = 'Ad blocker detected. Please disable it to watch ads.';
          } else if (error.code === 'INVALID_ZONE' || error.message?.includes('zone')) {
            errorMessage = 'Invalid zone configuration. Please check your zone ID.';
          } else {
            errorMessage = `Monetag error: ${error.message || error.code || 'Unknown error'}`;
          }
        } else if (typeof error === 'string') {
          errorMessage = `Monetag error: ${error}`;
        }
        
        if (onError) onError(errorMessage);
      }
    });
  } catch (error) {
    console.error('Monetag show error:', error);
    const errorMsg = `Failed to show Monetag ad: ${error.message || 'Unknown error'}`;
    if (onError) onError(errorMsg);
  }
}

/**
 * Check if Monetag is available
 */
export function isAvailable() {
  const available = typeof window.monetag !== "undefined" && 
                   isInitialized && 
                   monetagInstance !== null;
  
  console.log('Monetag availability check:', {
    sdkLoaded: typeof window.monetag !== "undefined",
    initialized: isInitialized,
    instanceReady: monetagInstance !== null,
    overall: available
  });
  
  return available;
}

/**
 * Get Monetag status for debugging
 */
export function getStatus() {
  return {
    sdkLoaded: typeof window.monetag !== "undefined",
    initialized: isInitialized,
    instanceReady: monetagInstance !== null,
    zoneId: config?.zoneId ? '***' + config.zoneId.slice(-4) : 'Not set', // Changed from publisherId
    config: config ? { ...config, zoneId: '***' + config.zoneId?.slice(-4) } : null,
    windowMonetag: typeof window.monetag
  };
}

/**
 * Reset Monetag instance (for debugging)
 */
export function reset() {
  console.log('Resetting Monetag instance...');
  monetagInstance = null;
  isInitialized = false;
  config = null;
}

/**
 * Force re-initialization (for debugging)
 */
export function reinitialize(adsConfig) {
  console.log('Force re-initializing Monetag...');
  reset();
  initialize(adsConfig);
}
