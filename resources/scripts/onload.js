// OnLoad helper
export default function (callback) {
  if (document.readyState === 'complete') {
    callback();
  } else if (window.addEventListener) {
    window.addEventListener('load', callback, false);
  } else if (window.attachEvent) {
    window.attachEvent('onload', callback);
  } else {
    window.onload = callback;
  }
}
