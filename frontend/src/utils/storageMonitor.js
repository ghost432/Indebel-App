// Monitor localStorage changes for debugging
const originalSetItem = localStorage.setItem;
const originalRemoveItem = localStorage.removeItem;
const originalClear = localStorage.clear;

localStorage.setItem = function(key, value) {
  if (key === 'token') {
    console.log('💾 localStorage.setItem("token"):', {
      valueLength: value?.length,
      valuePreview: value?.substring(0, 20) + '...',
      stack: new Error().stack.split('\n').slice(2, 5).join('\n')
    });
  }
  return originalSetItem.apply(this, arguments);
};

localStorage.removeItem = function(key) {
  if (key === 'token') {
    console.warn('🗑️ localStorage.removeItem("token") called from:', {
      stack: new Error().stack.split('\n').slice(2, 5).join('\n')
    });
  }
  return originalRemoveItem.apply(this, arguments);
};

localStorage.clear = function() {
  console.warn('🧹 localStorage.clear() called from:', {
    stack: new Error().stack.split('\n').slice(2, 5).join('\n')
  });
  return originalClear.apply(this, arguments);
};

console.log('🔍 Storage monitor activated');

export default {};
