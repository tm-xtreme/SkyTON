// src/ads/networks/monetag.js
let isInitialized = false;
let config = null;

/**
 * Initialize Monetag SDK
 * @param {Object} adsConfig - Configuration object with zoneId
 */
export function initialize(adsConfig) {
  if (isInitialized || !adsConfig.zoneId) {
    console.log('Monetag initialization skipped:', { 
      isInitialized, 
      hasZoneId: !!adsConfig.zoneId 
    });
    return;
  }

  config = adsConfig;

  // Wait for Monetag SDK to load
  const checkSDK = () => {
    if (typeof window.monetag !== "undefined") {
      try {
        console.log('Initializing Monetag with zone ID:', config.zoneId);
        
        // Monetag auto-initializes when script loads
        // We just need to verify it's ready
        isInitialized = true;
        console.log('Monetag initialized successfully with zone ID:', config.zoneId);
      } catch (error) {
        console.error('Failed to initialize Monetag:', error);
        isInitialized = false;
      }
    } else {
      console.log('Waiting for Monetag SDK to load...');
      setTimeout(checkSDK, 100);
    }
  };

  checkSDK();
}

/**
 * Show rewarded ad
 * @param {Object} handlers - Event handlers
 */
export function showAd({ onComplete, onClose, onError }) {
  console.log('Monetag showAd called:', { 
    isInitialized, 
    sdkLoaded: typeof window.monetag !== "undefined"
  });

  if (!isInitialized || typeof window.monetag === "undefined") {
    const errorMsg = 'Monetag not initialized. Please check your zone ID configuration.';
    console.error(errorMsg);
    if (onError) onError(errorMsg);
    return;
  }

  try {
    console.log('Showing Monetag ad with zone ID:', config.zoneId);
    
    // Monetag direct zone invocation (most common method)
    if (window.monetag && typeof window.monetag.invoke === 'function') {
      window.monetag.invoke({
        zone: config.zoneId,
        onComplete: () => {
          console.log('Monetag ad completed successfully - user rewarded');
          if (onComplete) onComplete();
        },
        onClose: () => {
          console.log('Monetag ad closed');
          if (onClose) onClose();
        },
        onError: (error) => {
          console.error('Monetag ad error:', error);
          handleMontagError(error, onError);
        }
      });
    } 
    // Alternative method for some Monetag implementations
    else if (window.monetag && typeof window.monetag.show === 'function') {
      window.monetag.show({
        zoneId: config.zoneId,
        onComplete: () => {
          console.log('Monetag ad completed successfully - user rewarded');
          if (onComplete) onComplete();
        },
        onClose: () => {
          console.log('Monetag ad closed');
          if (onClose) onClose();
        },
        onError: (error) => {
          console.error('Monetag ad error:', error);
          handleMontagError(error, onError);
        }
      });
    }
    // Direct zone call (simplest method)
    else {
      // Create ad container
      const adContainer = document.createElement('div');
      adContainer.id = `monetag-${config.zoneId}`;
      document.body.appendChild(adContainer);
      
      // Call Monetag zone directly
      if (window.monetag) {
        window.monetag(config.zoneId, {
          onComplete: () => {
            console.log('Monetag ad completed successfully - user rewarded');
            document.body.removeChild(adContainer);
            if (onComplete) onComplete();
          },
          onClose: () => {
            console.log('Monetag ad closed');
            document.body.removeChild(adContainer);
            if (onClose) onClose();
          },
          onError: (error) => {
            console.error('Monetag ad error:', error);
            document.body.removeChild(adContainer);
            handleMontagError(error, onError);
          }
        });
      } else {
        throw new Error('Monetag SDK not properly loaded');
      }
    }
  } catch (error) {
    console.error('Monetag show error:', error);
    const errorMsg = `Failed to show Monetag ad: ${error.message || 'Unknown error'}`;
    if (onError) onError(errorMsg);
  }
}

/**
 * Handle Monetag specific errors
 */
function handleMontagError(error, onError) {
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

/**
 * Check if Monetag is available
 */
export function isAvailable() {
  const available = typeof window.monetag !== "undefined" && isInitialized;
  
  console.log('Monetag availability check:', {
    sdkLoaded: typeof window.monetag !== "undefined",
    initialized: isInitialized,
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
    zoneId: config?.zoneId ? '***' + config.zoneId.slice(-4) : 'Not set',
    config: config ? { ...config, zoneId: '***' + config.zoneId?.slice(-4) } : null,
    windowMonetag: typeof window.monetag
  };
}

/**
 * Reset Monetag instance (for debugging)
 */
export function reset() {
  console.log('Resetting Monetag instance...');
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
