// src/ads/networks/monetag.js

let monetagInstance = null;
let isInitialized = false;

/**
 * Initialize Monetag SDK
 * @param {Object} config - Configuration object with publisherId
 */
export function initialize(config) {
  if (isInitialized || !config.publisherId) {
    return;
  }

  try {
    // Load Monetag SDK if not already loaded
    if (typeof window.monetag === "undefined") {
      loadMonetagSDK().then(() => {
        initializeMonetag(config);
      }).catch(error => {
        console.error('Failed to load Monetag SDK:', error);
      });
    } else {
      initializeMonetag(config);
    }
  } catch (error) {
    console.error('Monetag initialization error:', error);
  }
}

/**
 * Load Monetag SDK dynamically
 */
function loadMonetagSDK() {
  return new Promise((resolve, reject) => {
    if (typeof window.monetag !== "undefined") {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.monetag.io/monetag.min.js';
    script.async = true;
    script.onload = () => {
      console.log('Monetag SDK loaded successfully');
      resolve();
    };
    script.onerror = () => {
      reject(new Error('Failed to load Monetag SDK'));
    };
    document.head.appendChild(script);
  });
}

/**
 * Initialize Monetag instance
 */
function initializeMonetag(config) {
  try {
    monetagInstance = window.monetag.init({
      publisherId: config.publisherId,
      debug: import.meta.env.DEV, // Enable debug in development
    });
    isInitialized = true;
    console.log('Monetag initialized with publisher ID:', config.publisherId);
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
    if (onError) onError('Monetag not initialized');
    return;
  }

  try {
    monetagInstance.showRewardedAd({
      onReward: () => {
        // Ad completed successfully and user should be rewarded
        if (onComplete) onComplete();
      },
      onClose: () => {
        // Ad was closed (may or may not have been completed)
        if (onClose) onClose();
      },
      onError: (error) => {
        console.error('Monetag ad error:', error);
        if (onError) onError(`Monetag error: ${error.message || 'Unknown error'}`);
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
  return isInitialized && monetagInstance && typeof window.monetag !== "undefined";
}
