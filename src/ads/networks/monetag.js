export function showAd({ onComplete, onClose, onError }) {
  if (window.monetag) {
    window.monetag.showRewardedAd({
      onComplete,
      onClose,
      onError,
    });
  } else {
    onError('Monetag SDK not loaded');
  }
}
