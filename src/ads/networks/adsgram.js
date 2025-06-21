export function showAd({ onComplete, onClose, onError }) {
  if (window.adsgram) {
    window.adsgram.showRewardedAd({
      onComplete,
      onClose,
      onError,
    });
  } else {
    onError('Adsgram SDK not loaded');
  }
}
