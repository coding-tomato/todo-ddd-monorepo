export function handleError(err) {
  const existing = document.querySelector('.error-banner');
  if (existing) existing.remove();
  const banner = document.createElement('div');
  banner.className = 'error-banner';
  banner.setAttribute('role', 'alert');
  banner.textContent = err instanceof Error ? err.message : 'Something went wrong, please try again';
  document.querySelector('#app').prepend(banner);
  setTimeout(() => banner.remove(), 4000);
}

export function withErrorHandling(fn) {
  return (...args) => {
    try {
      fn(...args);
    } catch (err) {
      handleError(err);
    }
  };
}
