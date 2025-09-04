import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Admin authentication store
export const isLoggedIn = writable<boolean>(false);

// Check if user is logged in (from sessionStorage)
if (browser) {
  const savedAuth = sessionStorage.getItem('admin_authenticated');
  if (savedAuth === 'true') {
    isLoggedIn.set(true);
  }
}

// Subscribe to store changes and save to sessionStorage
isLoggedIn.subscribe((value) => {
  if (browser) {
    if (value) {
      sessionStorage.setItem('admin_authenticated', 'true');
    } else {
      sessionStorage.removeItem('admin_authenticated');
    }
  }
});

export function logout() {
  if (browser) {
    sessionStorage.removeItem('admin_key');
  }
  isLoggedIn.set(false);
}