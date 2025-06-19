'use client';

// A simple utility to manage a mock auth cookie for demo purposes.

export const setAuthCookie = () => {
  // Set a cookie that expires in 1 hour.
  const expires = new Date(Date.now() + 60 * 60 * 1000).toUTCString();
  document.cookie = `auth_token=mock_user_token; expires=${expires}; path=/`;
};

export const removeAuthCookie = () => {
  // Set the cookie's expiration to a past date to delete it.
  document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
};
