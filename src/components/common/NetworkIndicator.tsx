import React, { useEffect, useState } from 'react';

const NetworkIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return null; // Hide when online
  }

  return (
    <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-red-600 text-white rounded-md shadow-lg">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        <span className="text-sm font-medium">No internet connection</span>
      </div>
    </div>
  );
};

export default NetworkIndicator;

