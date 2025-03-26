import React from "react";
import { useNavigate } from "react-router-dom";
import { getOfflineData, clearOfflineData } from "./utils/localStore";
import { jwtDecode } from "jwt-decode";
import useNetworkStatus from "./utils/useNetworkStatus";

const Homepage = () => {
  const navigate = useNavigate();

  const isOffline = useNetworkStatus();

  // Decode the token to get the user role
  const token = localStorage.getItem("token");
  let role = null;
  if (token) {
    try {
      const decoded = jwtDecode(token);
      role = decoded.role; // e.g., "Admin", "Doctor", or "volunteer"
    } catch (error) {
      console.error("Error decoding token in Homepage:", error);
    }
  }

  // Log out: remove token and navigate to login
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Navigate to the appropriate dashboard for Admin/Doctor
  const handleDashboard = () => {
    if (role === "Admin") {
      navigate("/admin-dashboard");
    } else if (role === "Doctor") {
      navigate("/doctor-dashboard");
    }
  };

  // Manual sync: retrieve offline data and send to the backend
  const handleSync = async () => {
    if (isOffline) {
      alert(
        "You're offline. Please connect to the internet to sync your data."
      );
      return;
    }
    try {
      const offlineQueue = await getOfflineData();
      if (!offlineQueue || offlineQueue.length === 0) {
        alert("No offline data to sync.");
        return;
      }

      for (const req of offlineQueue) {
        try {
          const response = await fetch(req.url, {
            method: req.method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req.body),
          });
          if (!response.ok) {
            console.error("Sync failed for request: ", req);
          }
        } catch (err) {
          console.error("Error syncing request: ", req, err);
        }
      }
      await clearOfflineData();
      alert("Offline data synced successfully!");
    } catch (err) {
      console.error("Error during manual sync: ", err);
      alert("An error occurred during syncing.");
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 text-white">
      {/* Log Out Button */}
      <div className="absolute top-4 left-4">
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
        >
          Log Out
        </button>
      </div>

      {/* Conditional Dashboard Button */}
      {(role === "Admin" || role === "Doctor") && (
        <div className="absolute top-4 right-4">
          <button
            onClick={handleDashboard}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
          >
            {role === "Admin" ? "Admin Dashboard" : "Doctor Dashboard"}
          </button>
        </div>
      )}

      <div className="max-w-3xl text-center bg-gradient-to-br from-purple-700 to-indigo-700 p-8 rounded-lg shadow-lg">
        <h1 className="text-5xl font-extrabold mb-6">
          Welcome to Patient Data Collection
        </h1>
        <p className="text-lg text-gray-300 mb-8">
          A secure and efficient way to manage patient information.
        </p>

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate("/register")}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-lg shadow-md"
          >
            Register Patient
          </button>
          {/* Hide the group registration button when offline */}
          {!isOffline && (
            <button
              onClick={() => navigate("/groupregister")}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg text-lg shadow-md"
            >
              Register Family Group
            </button>
          )}
          {(role === "Admin" || role === "Doctor") && (
            <button
              onClick={() => navigate("/edit-family-group")}
              className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-lg shadow-md"
            >
              Edit Family Groups
            </button>
          )}
        </div>
      </div>

      {/* Manual Sync Button in bottom-right */}
      <button
        onClick={handleSync}
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 1000,
        }}
        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded shadow-md"
      >
        Sync Data
      </button>
    </div>
  );
};

export default Homepage;
