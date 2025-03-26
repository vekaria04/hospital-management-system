import localforage from "localforage";

localforage.config({
  name: "patientDataApp",
  storeName: "offlineRequests",
});

export const saveOfflineData = async (data) => {
  try {
    const queue = (await localforage.getItem("queue")) || [];
    queue.push(data);
    await localforage.setItem("queue", queue);
    console.log("Data saved offline");
  } catch (err) {
    console.error("Error saving data offline:", err);
  }
};

export const getOfflineData = async () => {
  return (await localforage.getItem("queue")) || [];
};

export const clearOfflineData = async () => {
  await localforage.removeItem("queue");
};
