// src/ads/adsController.js
// Central controller to handle multiple ad networks for rewarded ads

// Import wrappers for each ad network (implement these separately)
import * as adsgram from './networks/adsgram';
import * as monetag from './networks/monetag';
// import * as network3 from './networks/network3';
// import * as network4 from './networks/network4';

// List all available networks in order of preference or for rotation
const adNetworks = [
  {
    name: 'adsgram',
    showAd: adsgram.showAd,
    isAvailable: () => typeof window.adsgram !== "undefined",
  },
  {
    name: 'monetag',
    showAd: monetag.showAd,
    isAvailable: () => typeof window.monetag !== "undefined",
  },
  // Add more networks here
  // {
  //   name: 'network3',
  //   showAd: network3.showAd,
  //   isAvailable: () => typeof window.network3 !== "undefined",
  // },
  // {
  //   name: 'network4',
  //   showAd: network4.showAd,
  //   isAvailable: () => typeof window.network4 !== "undefined",
  // },
];

let lastNetworkIndex = -1;

/**
 * Shows a rewarded ad from any available network.
 * Tries each network in rotation until one is available.
 * @param {{onComplete: function, onClose: function, onError: function}} handlers
 */
export function showRewardedAd(handlers) {
  const totalNetworks = adNetworks.length;
  for (let i = 0; i < totalNetworks; i++) {
    lastNetworkIndex = (lastNetworkIndex + 1) % totalNetworks;
    const { isAvailable, showAd, name } = adNetworks[lastNetworkIndex];
    if (isAvailable()) {
      try {
        showAd(handlers);
        return;
      } catch (e) {
        if (handlers.onError) handlers.onError(`Error in ${name}: ${e}`);
      }
    }
  }
  if (handlers.onError) handlers.onError("No ad networks available or all failed.");
}
