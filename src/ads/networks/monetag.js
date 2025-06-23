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
    
    // FIXED: Correct condition check
    if (typeof window.monetag !== "undefined" || 
        typeof window.MonetizeMore !== "undefined" || 
        typeof window.adngin !== "undefined") {
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

  if (!isInitialized) {
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
    
    // Method 1: Try window.monetag function
    if (typeof window.monetag === 'function') {
      console.log('Using direct monetag() call');
      window.monetag(config.zoneId);
      // Monetag typically doesn't provide callbacks, so we simulate success
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 100);
      return;
    }

    // Method 2: Try MonetizeMore object
    if (window.MonetizeMore && typeof window.MonetizeMore.show === 'function') {
      console.log('Using MonetizeMore.show() method');
      window.MonetizeMore.show(config.zoneId);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 100);
      return;
    }

    // Method 3: Try creating ad element dynamically
    if (typeof window.monetag !== "undefined") {
      console.log('Creating dynamic ad element');
      const adContainer = document.createElement('div');
      adContainer.id = `monetag-${config.zoneId}`;
      document.body.appendChild(adContainer);
      
      // Trigger ad display
      const script = document.createElement('script');
      script.innerHTML = `
        if (typeof window.monetag === 'function') {
          window.monetag('${config.zoneId}');
        }
      `;
      document.head.appendChild(script);
      
      setTimeout(() => {
        document.head.removeChild(script);
        if (adContainer.parentNode) {
          document.body.removeChild(adContainer);
        }
        if (onComplete) onComplete();
      }, 1000);
      return;
    }

    // If no methods work, throw error
    throw new Error('No valid Monetag methods found. SDK may not be loaded properly.');

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
  const available = (typeof window.monetag !== "undefined" || 
                    typeof window.MonetizeMore !== "undefined") && 
                    isInitialized;
  
  console.log('Monetag availability check:', {
    sdkLoaded: typeof window.monetag !== "undefined",
    monetizeMore: typeof window.MonetizeMore !== "undefined",
    initialized: isInitialized,
    overall: available,
    hasConfig: !!config,
    zoneId: config?.zoneId ? '***' + config.zoneId.slice(-4) : 'Not set'
  });
  
  return available;
}

// ... rest of your functions remain the same
