// src/ads/adsController.js
// Central controller to handle multiple ad networks for rewarded ads

// Import wrappers for each ad network
import * as adsgram from './networks/adsgram';
import * as monetag from './networks/monetag';
// import * as network3 from './networks/network3';
// import * as network4 from './networks/network4';

// Configuration for ad networks
const AD_CONFIG = {
  adsgram: {
    blockId: import.meta.env.VITE_ADSGRAM_BLOCK_ID,
    enabled: import.meta.env.VITE_ADSGRAM_ENABLED === 'true',
  },
  monetag: {
    zoneId: import.meta.env.VITE_MONETAG_ZONE_ID, // Changed from publisherId to zoneId
    enabled: import.meta.env.VITE_MONETAG_ENABLED === 'true',
  },
  // Add more network configs here
};

// List all available networks in order of preference
const adNetworks = [
  {
    name: 'adsgram',
    showAd: adsgram.showAd,
    isAvailable: () => {
      return AD_CONFIG.adsgram.enabled && 
             AD_CONFIG.adsgram.blockId && 
             adsgram.isAvailable();
    },
    config: AD_CONFIG.adsgram,
  },
  {
    name: 'monetag',
    showAd: monetag.showAd,
    isAvailable: () => {
      return AD_CONFIG.monetag.enabled && 
             AD_CONFIG.monetag.zoneId && // Changed from publisherId to zoneId
             monetag.isAvailable();
    },
    config: AD_CONFIG.monetag,
  },
  // Add more networks here
];

let lastNetworkIndex = -1;
let isAdLoading = false;
let initializationAttempted = false;

/**
 * Initialize ad networks on app start
 */
export function initializeAdNetworks() {
  if (initializationAttempted) {
    console.log('Ad networks already initialized');
    return;
  }
  
  initializationAttempted = true;
  console.log('Initializing ad networks...');
  
  // Wait a bit for scripts to load
  setTimeout(() => {
    adNetworks.forEach(network => {
      if (network.config.enabled) {
        try {
          console.log(`Initializing ${network.name}...`);
          
          if (network.name === 'adsgram') {
            adsgram.initialize(network.config);
          } else if (network.name === 'monetag') {
            monetag.initialize(network.config);
          }
          
          console.log(`${network.name} initialization completed`);
        } catch (error) {
          console.error(`Failed to initialize ${network.name}:`, error);
        }
      } else {
        console.log(`${network.name} is disabled in configuration`);
      }
    });
    
    // Log final status
    console.log('Ad networks initialization finished. Status:', getAdNetworkStatus());
  }, 1000); // Give scripts time to load
}

/**
 * Shows a rewarded ad from any available network.
 * Tries each network in rotation until one is available.
 * @param {{onComplete: function, onClose: function, onError: function}} handlers
 */
export function showRewardedAd(handlers) {
  // Validate handlers
  if (!handlers || typeof handlers !== 'object') {
    console.error('Invalid handlers provided to showRewardedAd');
    return;
  }

  if (isAdLoading) {
    console.log('Ad is already loading, rejecting new request');
    if (handlers.onError) {
      handlers.onError("Ad is already loading. Please wait.");
    }
    return;
  }

  const availableNetworks = adNetworks.filter(network => 
    network.config.enabled && network.isAvailable()
  );

  console.log(`Found ${availableNetworks.length} available ad networks`);

  if (availableNetworks.length === 0) {
    console.log('No ad networks available. Status:', getAdNetworkStatus());
    if (handlers.onError) {
      handlers.onError("No ads available right now. Please try again later.");
    }
    return;
  }

  isAdLoading = true;
  let attemptedNetworks = 0;
  const totalNetworks = availableNetworks.length;

  const tryNextNetwork = () => {
    if (attemptedNetworks >= totalNetworks) {
      isAdLoading = false;
      console.log('All ad networks exhausted');
      if (handlers.onError) {
        handlers.onError("All ad networks failed to load ads. Please try again later.");
      }
      return;
    }

    lastNetworkIndex = (lastNetworkIndex + 1) % totalNetworks;
    const network = availableNetworks[lastNetworkIndex];
    attemptedNetworks++;

    console.log(`Attempting to show ad from ${network.name} (attempt ${attemptedNetworks}/${totalNetworks})...`);

    try {
      network.showAd({
        onComplete: () => {
          isAdLoading = false;
          console.log(`Ad completed successfully from ${network.name}`);
          if (handlers.onComplete) {
            try {
              handlers.onComplete();
            } catch (error) {
              console.error('Error in onComplete handler:', error);
            }
          }
        },
        onClose: () => {
          isAdLoading = false;
          console.log(`Ad closed from ${network.name}`);
          if (handlers.onClose) {
            try {
              handlers.onClose();
            } catch (error) {
              console.error('Error in onClose handler:', error);
            }
          }
        },
        onError: (error) => {
          console.error(`Ad error from ${network.name}:`, error);
          // Try next network if current one fails
          setTimeout(tryNextNetwork, 500);
        }
      });
    } catch (error) {
      console.error(`Exception in ${network.name}:`, error);
      // Try next network if current one throws exception
      setTimeout(tryNextNetwork, 500);
    }
  };

  tryNextNetwork();
}

/**
 * Check if any ad network is available
 */
export function isAdAvailable() {
  const available = adNetworks.some(network => 
    network.config.enabled && network.isAvailable()
  );
  console.log('Ad availability check:', available);
  return available;
}

/**
 * Get status of all ad networks for debugging
 */
export function getAdNetworkStatus() {
  return adNetworks.map(network => {
    const status = {
      name: network.name,
      enabled: network.config.enabled,
      available: false,
      sdkLoaded: false,
      config: {}
    };

    try {
      status.available = network.isAvailable();
      
      if (network.name === 'adsgram') {
        status.sdkLoaded = typeof window.Adsgram !== "undefined";
        status.config = {
          blockId: network.config.blockId ? '***' + network.config.blockId.slice(-4) : 'Not set'
        };
      } else if (network.name === 'monetag') {
        status.sdkLoaded = typeof window.monetag !== "undefined";
        status.config = {
          zoneId: network.config.zoneId ? '***' + network.config.zoneId.slice(-4) : 'Not set'
        };
      }
    } catch (error) {
      console.error(`Error getting status for ${network.name}:`, error);
      status.error = error.message;
    }

    return status;
  });
}

/**
 * Force re-initialization of ad networks (for debugging)
 */
export function reinitializeAdNetworks() {
  console.log('Force re-initializing ad networks...');
  initializationAttempted = false;
  isAdLoading = false;
  lastNetworkIndex = -1;
  initializeAdNetworks();
}

/**
 * Get detailed debug information
 */
export function getDebugInfo() {
  return {
    initializationAttempted,
    isAdLoading,
    lastNetworkIndex,
    availableNetworks: adNetworks.filter(n => n.config.enabled && n.isAvailable()).length,
    totalNetworks: adNetworks.length,
    windowObjects: {
      Adsgram: typeof window.Adsgram,
      monetag: typeof window.monetag
    },
    config: {
      adsgramEnabled: AD_CONFIG.adsgram.enabled,
      adsgramBlockId: AD_CONFIG.adsgram.blockId ? 'Set' : 'Not set',
      monetagEnabled: AD_CONFIG.monetag.enabled,
      monetagZoneId: AD_CONFIG.monetag.zoneId ? 'Set' : 'Not set'
    }
  };
}
