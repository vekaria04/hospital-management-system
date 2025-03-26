import { useEffect } from "react";
import { getOfflineData, clearOfflineData } from "./localStore";

const useOnlineSync = () => {
  useEffect(() => {
    const syncData = async () => {
      const offlineQueue = await getOfflineData();
      if (offlineQueue.length === 0) return;

      for (const req of offlineQueue) {
        try {
          const response = await fetch(req.url, {
            method: req.method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req.body),
          });
          if (!response.ok) {
            console.error("Failed to sync a request", req);
          }
        } catch (err) {
          console.error("Sync error for request", req, err);
        }
      }
      await clearOfflineData();
      alert("Offline data has been synced!");
    };

    const handleOnline = () => {
      console.log("Back online, syncing offline data");
      syncData();
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);
};

export default useOnlineSync;
