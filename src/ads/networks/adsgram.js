// src/ads/networks/adsgram.js

let adsgramInstance = null;
let isInitialized = false;

/**
 * Initialize Adsgram SDK
 * @param {Object} config - Configuration object with blockId
 */
export function initialize(config) {
  if (isInitialized || !config.blockId) {
    return;
  }

  try {
    // Load Adsgram SDK if not already loaded
    if (typeof window.Adsgram === "undefined") {
      loadAdsgramSDK().then(() => {
        initializeAdsgram(config);
      }).catch(error => {
        console.error('Failed to load Adsgram SDK:', error);
      });
    } else {
      initializeAdsgram(config);
    }
  } catch (error) {
    console.error('Adsgram initialization error:', error);
  }
}

/**
 * Load Adsgram SDK dynamically
 */
function loadAdsgramSDK() {
  return new Promise((resolve, reject) => {
    if (typeof window.Adsgram !== "undefined") {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sad.adsgram.ai/js/sad.min.js';
    script.async = true;
    script.onload = () => {
      console.log('Adsgram SDK loaded successfully');
      resolve();
    };
    script.onerror = () => {
      reject(new Error('Failed to load Adsgram SDK'));
    };
    document.head.appendChild(script);
  });
}

/**
 * Initialize Adsgram instance
 */
function initializeAdsgram(config) {
  try {
    adsgramInstance = window.Adsgram.init({
      blockId: config.blockId,
      debug: import.meta.env.DEV, // Enable debug in development
    });
    isInitialized = true;
    console.log('Adsgram initialized with block ID:', config.blockId);
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
    if (onError) onError('Adsgram not initialized');
    return;
  }

  try {
    adsgramInstance.show().then(() => {
      // Ad completed successfully
      if (onComplete) onComplete();
    }).catch((error) => {
      console.error('Adsgram ad error:', error);
      if (error.message === 'AdBlock') {
        if (onError) onError('Ad blocker detected. Please disable it to watch ads.');
      } else if (error.message === 'NotReady') {
        if (onError) onError('Ad not ready. Please try again in a moment.');
      } else if (error.message === 'NotAllowed') {
        if (onError) onError('Ads not allowed in this context.');
      } else {
        if (onError) onError(`Adsgram error: ${error.message || 'Unknown error'}`);
      }
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
  return isInitialized && adsgramInstance && typeof window.Adsgram !== "undefined";
}
