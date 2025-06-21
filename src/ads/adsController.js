import * as adsgram from './networks/adsgram';
import * as monetag from './networks/monetag';
// import * as network3 from './networks/network3';
// import * as network4 from './networks/network4';

const networks = [
  adsgram,
  monetag,
  // network3,
  // network4,
];

let lastUsed = 0;

export function showRewardedAd(handlers) {
  lastUsed = (lastUsed + 1) % networks.length;
  const network = networks[lastUsed];
  network.showAd(handlers);
}
