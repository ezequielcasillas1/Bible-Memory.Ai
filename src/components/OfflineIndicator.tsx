import React from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

const OfflineIndicator: React.FC = () => {
  const { isOnline } = usePWA();
  const [showOfflineMessage, setShowOfflineMessage] = React.useState(false);

  React.useEffect(() => {
    if (!isOnline) {
      setShowOfflineMessage(true);
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setShowOfflineMessage(false);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      // Show "back online" message briefly
      if (showOfflineMessage) {
        const timer = setTimeout(() => {
          setShowOfflineMessage(false);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [isOnline, showOfflineMessage]);

  if (!showOfflineMessage) {
    return null;
  }

  return (
    <div className="fixed top-20 left-4 right-4 z-50 animate-slide-up">
      <div className={`mx-auto max-w-sm rounded-lg shadow-lg border p-3 ${
        isOnline 
          ? 'bg-green-50 border-green-200' 
          : 'bg-yellow-50 border-yellow-200'
      }`}>
        <div className="flex items-center space-x-3">
          {isOnline ? (
            <Wifi className="w-5 h-5 text-green-600" />
          ) : (
            <WifiOff className="w-5 h-5 text-yellow-600" />
          )}
          <div>
            <p className={`font-medium text-sm ${
              isOnline ? 'text-green-800' : 'text-yellow-800'
            }`}>
              {isOnline ? 'Back Online!' : 'You\'re Offline'}
            </p>
            <p className={`text-xs ${
              isOnline ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {isOnline 
                ? 'All features are now available'
                : 'Some features may be limited. Your progress is saved locally.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflineIndicator;