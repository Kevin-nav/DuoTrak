// src/lib/apiClient.ts
import { apiFetch } from './api/core';

const apiClient = {
  get: async <T>(url: string): Promise<{ data: T }> => {
    const response = await apiFetch(url, { method: 'GET' });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return { data };
  },

  post: async <T>(url: string, body: any): Promise<{ data: T }> => {
    const response = await apiFetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return { data };
  },

  put: async <T>(url: string, body: any): Promise<{ data: T }> => {
    const response = await apiFetch(url, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return { data };
  },

  delete: async (url: string): Promise<void> => {
    const response = await apiFetch(url, { method: 'DELETE' });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  },
};

export default apiClient;
