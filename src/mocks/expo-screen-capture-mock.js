// Mock implementation of expo-screen-capture to avoid permission issues
export function usePreventScreenCapture() {
  // No-op
}

export function addScreenshotListener(listener) {
  // Return a no-op subscription
  return {
    remove: () => {}
  };
}

export function removeScreenshotListener(subscription) {
  // No-op
}

export function allowScreenCaptureAsync() {
  return Promise.resolve();
}

export function preventScreenCaptureAsync() {
  return Promise.resolve();
}

export function isAvailableAsync() {
  return Promise.resolve(false);
}

// Default export
export default {
  usePreventScreenCapture,
  addScreenshotListener,
  removeScreenshotListener,
  allowScreenCaptureAsync,
  preventScreenCaptureAsync,
  isAvailableAsync
};