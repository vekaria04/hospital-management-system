import React from "react";
import { useNavigate } from "react-router-dom";

const DoctorDashboard = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold mb-4">Doctor Dashboard</h1>
      <p className="mb-8">
        Welcome, Doctor! Here you can manage your appointments and patient data.
      </p>
      <button
        onClick={handleBack}
        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
      >
        Back to Homepage
      </button>
    </div>
  );
};

export default DoctorDashboard;
