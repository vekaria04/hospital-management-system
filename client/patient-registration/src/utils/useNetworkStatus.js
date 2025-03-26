import { useState, useEffect } from "react";

const useNetworkStatus = () => {
  // Use navigator.onLine as default
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // For testing, you can force offline mode here by uncommenting:
  // return true; // Force offline for testing
  return isOffline;
};

export default useNetworkStatus;
