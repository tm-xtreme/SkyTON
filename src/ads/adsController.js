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
    blockId: int-12059, //import.meta.env.VITE_ADSGRAM_BLOCK_ID,
    enabled: import.meta.env.VITE_ADSGRAM_ENABLED === 'true',
  },
  monetag: {
    publisherId: import.meta.env.VITE_MONETAG_PUBLISHER_ID,
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
             AD_CONFIG.monetag.publisherId && 
             monetag.isAvailable();
    },
    config: AD_CONFIG.monetag,
  },
  // Add more networks here
];

let lastNetworkIndex = -1;
let isAdLoading = false;

/**
 * Initialize ad networks on app start
 */
export function initializeAdNetworks() {
  console.log('Initializing ad networks...');
  
  // Wait a bit for scripts to load
  setTimeout(() => {
    adNetworks.forEach(network => {
      if (network.config.enabled) {
        try {
          if (network.name === 'adsgram') {
            adsgram.initialize(network.config);
          } else if (network.name === 'monetag') {
            monetag.initialize(network.config);
          }
          console.log(`${network.name} initialized successfully`);
        } catch (error) {
          console.error(`Failed to initialize ${network.name}:`, error);
        }
      }
    });
  }, 1000); // Give scripts time to load
}

/**
 * Shows a rewarded ad from any available network.
 * Tries each network in rotation until one is available.
 * @param {{onComplete: function, onClose: function, onError: function}} handlers
 */
export function showRewardedAd(handlers) {
  if (isAdLoading) {
    if (handlers.onError) {
      handlers.onError("Ad is already loading. Please wait.");
    }
    return;
  }

  const availableNetworks = adNetworks.filter(network => 
    network.config.enabled && network.isAvailable()
  );

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
          if (handlers.onComplete) handlers.onComplete();
        },
        onClose: () => {
          isAdLoading = false;
          console.log(`Ad closed from ${network.name}`);
          if (handlers.onClose) handlers.onClose();
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
  return adNetworks.some(network => 
    network.config.enabled && network.isAvailable()
  );
}

/**
 * Get status of all ad networks for debugging
 */
export function getAdNetworkStatus() {
  return adNetworks.map(network => ({
    name: network.name,
    enabled: network.config.enabled,
    available: network.isAvailable(),
    sdkLoaded: network.name === 'adsgram' ? 
      typeof window.Adsgram !== "undefined" : 
      typeof window.monetag !== "undefined",
    config: {
      ...network.config,
      // Hide sensitive data in logs
      blockId: network.config.blockId ? '***' + network.config.blockId.slice(-4) : undefined,
      publisherId: network.config.publisherId ? '***' + network.config.publisherId.slice(-4) : undefined,
    }
  }));
}
