// A simple logger that persists logs in sessionStorage to survive page reloads.

export const persistentLog = (message: string, data?: any) => {
  // Check if sessionStorage is available (i.e., we are in a browser environment)
  if (typeof window === 'undefined' || !window.sessionStorage) {
    // If not in a browser, just log to the console and exit.
    console.log(`[SSR Log] ${message}`, data !== undefined ? data : '');
    return;
  }

  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    message,
    data: data !== undefined ? data : null,
  };

  try {
    // Initialize logs if they don't exist
    if (!sessionStorage.getItem('app_logs')) {
        sessionStorage.setItem('app_logs', '[]');
    }
    const existingLogs = JSON.parse(sessionStorage.getItem('app_logs') as string);
    existingLogs.push(logEntry);
    sessionStorage.setItem('app_logs', JSON.stringify(existingLogs, null, 2));
  } catch (error) {
    console.error("Failed to write to persistent log:", error);
  }
};

export const getPersistentLogs = () => {
  try {
    return JSON.parse(sessionStorage.getItem('app_logs') || '[]');
  } catch (error) {
    console.error("Failed to read persistent logs:", error);
    return [];
  }
};

export const clearPersistentLogs = () => {
    try {
        sessionStorage.removeItem('app_logs');
        console.log('Persistent logs cleared.');
    } catch (error) {
        console.error("Failed to clear persistent logs:", error);
    }
}

// Attach to window for easy access from the browser console.
if (typeof window !== 'undefined') {
    (window as any).getLogs = getPersistentLogs;
    (window as any).clearLogs = clearPersistentLogs;
    console.log('Persistent logger initialized. Use getLogs() and clearLogs() in the console.');
}
