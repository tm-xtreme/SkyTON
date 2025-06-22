// src/ads/networks/monetag.js
let isInitialized = false;
let config = null;
let sdkCheckInterval = null;

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
  console.log('Starting Monetag initialization with zone ID:', config.zoneId);

  // Wait for Monetag SDK to load with timeout
  let attempts = 0;
  const maxAttempts = 50; // 5 seconds max wait
  
  const checkSDK = () => {
    attempts++;
    
    if (typeof window.monetag !== "undefined") {
      try {
        console.log('Monetag SDK loaded successfully');
        isInitialized = true;
        console.log('Monetag initialized successfully with zone ID:', config.zoneId);
        
        if (sdkCheckInterval) {
          clearInterval(sdkCheckInterval);
          sdkCheckInterval = null;
        }
      } catch (error) {
        console.error('Failed to initialize Monetag:', error);
        isInitialized = false;
      }
    } else if (attempts >= maxAttempts) {
      console.error('Monetag SDK failed to load after', maxAttempts * 100, 'ms');
      if (sdkCheckInterval) {
        clearInterval(sdkCheckInterval);
        sdkCheckInterval = null;
      }
    } else {
      console.log(`Waiting for Monetag SDK to load... (attempt ${attempts}/${maxAttempts})`);
    }
  };

  // Start checking immediately, then every 100ms
  checkSDK();
  if (!isInitialized && attempts < maxAttempts) {
    sdkCheckInterval = setInterval(checkSDK, 100);
  }
}

/**
 * Show rewarded ad
 * @param {Object} handlers - Event handlers
 */
export function showAd({ onComplete, onClose, onError }) {
  console.log('Monetag showAd called:', { 
    isInitialized, 
    sdkLoaded: typeof window.monetag !== "undefined",
    hasConfig: !!config,
    zoneId: config?.zoneId
  });

  if (!isInitialized || typeof window.monetag === "undefined") {
    const errorMsg = 'Monetag not initialized. Please check your zone ID configuration.';
    console.error(errorMsg);
    if (onError) onError(errorMsg);
    return;
  }

  if (!config?.zoneId) {
    const errorMsg = 'Monetag zone ID not configured.';
    console.error(errorMsg);
    if (onError) onError(errorMsg);
    return;
  }

  try {
    console.log('Attempting to show Monetag ad with zone ID:', config.zoneId);
    
    // Method 1: Try direct zone invocation (most common)
    if (window.monetag && typeof window.monetag === 'function') {
      console.log('Using direct monetag() call');
      window.monetag(config.zoneId, {
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
      return;
    }

    // Method 2: Try invoke method
    if (window.monetag && typeof window.monetag.invoke === 'function') {
      console.log('Using monetag.invoke() method');
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
      return;
    }

    // Method 3: Try show method
    if (window.monetag && typeof window.monetag.show === 'function') {
      console.log('Using monetag.show() method');
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
      return;
    }

    // If no methods work, throw error
    throw new Error('No valid Monetag methods found. Available methods: ' + Object.keys(window.monetag || {}));

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
    overall: available,
    windowMonetag: typeof window.monetag,
    hasConfig: !!config,
    zoneId: config?.zoneId ? '***' + config.zoneId.slice(-4) : 'Not set'
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
    windowMonetag: typeof window.monetag,
    availableMethods: window.monetag ? Object.keys(window.monetag) : []
  };
}

/**
 * Reset Monetag instance (for debugging)
 */
export function reset() {
  console.log('Resetting Monetag instance...');
  isInitialized = false;
  config = null;
  
  if (sdkCheckInterval) {
    clearInterval(sdkCheckInterval);
    sdkCheckInterval = null;
  }
}

/**
 * Force re-initialization (for debugging)
 */
export function reinitialize(adsConfig) {
  console.log('Force re-initializing Monetag...');
  reset();
  initialize(adsConfig);
}
