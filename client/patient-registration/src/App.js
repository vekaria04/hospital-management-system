import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
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
    role = decoded.role; // Assumes token payload includes a "role" field
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
