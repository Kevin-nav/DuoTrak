'use client';

import { useUser } from '@/contexts/UserContext';
import { useEffect, useState } from 'react';

export function MockAuthIndicator() {
  const { isMockMode, userDetails } = useUser();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV === 'development' && isMockMode) {
      setIsVisible(true);
    }
  }, [isMockMode]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 max-w-sm z-50 shadow-lg">
      <div className="flex items-start space-x-2">
        <span className="text-yellow-600 text-2xl">⚠️</span>
        <div>
          <h3 className="font-bold text-yellow-800">Mock Auth Active</h3>
          <p className="text-sm text-yellow-700 mt-1">
            Status: <code className="bg-yellow-200 px-1 rounded">
              {userDetails?.account_status || 'Loading...'}
            </code>
          </p>
          <p className="text-xs text-yellow-600 mt-2">
            Development mode only
          </p>
        </div>
      </div>
    </div>
  );
}
