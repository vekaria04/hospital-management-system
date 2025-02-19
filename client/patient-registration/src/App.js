import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom";
import { jwtDecode } from "jwt-decode";

// Import your components
import PatientRegistrationForm from "./PatientRegistration/PatientRegistrationForm";
import GroupRegistrationForm from "./PatientRegistration/GroupRegistrationForm";
import Homepage from "./Homepage";
import EditFamilyGroups from "./FamilyGroups/EditFamilyGroups";
import HealthQuestionnaire from "./PatientRegistration/HealthQuestionnaire";
import VerifyEmail from "./Auth/VerifyEmail";
import Login from "./Auth/Login";
import AdminDashboard from "./Dashboards/adminDash";
import DoctorDashboard from "./Dashboards/doctorDash";

// Navbar component
const Navbar = () => {
  const token = localStorage.getItem("token");
  let role = null;

  if (token) {
    try {
      const decoded = jwtDecode(token);
      role = decoded.role; // Extract role from token
    } catch (error) {
      console.error("Error decoding token:", error);
    }
  }

  return (
    <nav className="bg-blue-600 p-4 flex justify-between items-center">
      <Link to="/" className="text-white text-lg font-bold">
        Hospital System
      </Link>
      <div className="flex space-x-4">
        {role === "Admin" && (
          <Link to="/admin-dashboard" className="text-white">
            Admin Dashboard
          </Link>
        )}
        {role === "Doctor" && (
          <Link to="/doctor-dashboard" className="text-white">
            Doctor Dashboard
          </Link>
        )}
        {token ? (
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = "/login"; // Redirect to login
            }}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Logout
          </button>
        ) : (
          <Link to="/login" className="text-white">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

// ProtectedRoute component to guard routes based on authentication and role
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("token");

  // If no token, redirect to login
  if (!token) return <Navigate to="/login" replace />;

  let role = null;
  try {
    const decoded = jwtDecode(token);
    // Check token expiration (decoded.exp is in seconds)
    if (decoded.exp * 1000 < Date.now()) {
      console.log("Token expired");
      return <Navigate to="/login" replace />;
    }
    role = decoded.role; // Extract role from token
  } catch (error) {
    console.error("Error decoding token:", error);
    return <Navigate to="/login" replace />;
  }

  // If allowedRoles is provided and the user's role isn't in the list, redirect to homepage
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  // If everything checks out, render the protected component
  return children;
};

const App = () => {
  return (
    <Router>
      <Navbar /> {/* ✅ Added Navbar here */}
      <Routes>
        {/* Public Route: Login */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Homepage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/register"
          element={
            <ProtectedRoute>
              <PatientRegistrationForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/groupregister"
          element={
            <ProtectedRoute>
              <GroupRegistrationForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-family-group"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Doctor"]}>
              <EditFamilyGroups />
            </ProtectedRoute>
          }
        />
        <Route
          path="/health-questionnaire/:patientId"
          element={
            <ProtectedRoute>
              <HealthQuestionnaire />
            </ProtectedRoute>
          }
        />
        {/* If email verification should be public, you can remove the ProtectedRoute wrapper */}
        <Route
          path="/verify-email/:token"
          element={
            <ProtectedRoute>
              <VerifyEmail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor-dashboard"
          element={
            <ProtectedRoute allowedRoles={["Doctor"]}>
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback: redirect any unknown paths to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
