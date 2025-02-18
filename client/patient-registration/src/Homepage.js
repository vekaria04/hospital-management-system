import React from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const Homepage = () => {
  const navigate = useNavigate();

  // Decode the token to get the user role
  const token = localStorage.getItem("token");
  let role = null;
  if (token) {
    try {
      const decoded = jwtDecode(token);
      role = decoded.role; // Assumes your token payload contains a "role" field (e.g., "Admin" or "Doctor")
    } catch (error) {
      console.error("Error decoding token in Homepage:", error);
    }
  }

  // Log out: remove the token and navigate to login
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Navigate to the appropriate dashboard based on role
  const handleDashboard = () => {
    if (role === "Admin") {
      navigate("/admin-dashboard");
    } else if (role === "Doctor") {
      navigate("/doctor-dashboard");
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 text-white">
      {/* Log Out button in the top left */}
      <div className="absolute top-4 left-4">
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
        >
          Log Out
        </button>
      </div>

      {/* Conditional Dashboard button in the top right for Admin or Doctor */}
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

        <div className="flex gap-4">
          <button
            onClick={() => navigate("/register")}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-lg shadow-md"
          >
            Register Patient
          </button>

          <button
            onClick={() => navigate("/groupregister")}
            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg text-lg shadow-md"
          >
            Register Family Group
          </button>

          {/* Only show "Edit Family Groups" if logged in as Admin or Doctor */}
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
    </div>
  );
};

export default Homepage;
