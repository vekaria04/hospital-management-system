import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    familyGroupId: "",
    assignedDoctorId: ""
  });
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [doctors, setDoctors] = useState([]);

  // Always fetch token when needed
  const getToken = () => localStorage.getItem("token");

  // Fetch patients with filters (client-side filtering with server-side support)
  const fetchPatients = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.firstName) params.append("firstName", filters.firstName);
      if (filters.lastName) params.append("lastName", filters.lastName);
      if (filters.email) params.append("email", filters.email);
      if (filters.phoneNumber) params.append("phoneNumber", filters.phoneNumber);
      if (filters.familyGroupId) params.append("familyGroupId", filters.familyGroupId);
      if (filters.assignedDoctorId) params.append("assignedDoctorId", filters.assignedDoctorId);

      const response = await fetch(`/api/patients?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      } else {
        console.error("Failed to fetch patients");
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  // Fetch all doctors to populate the dropdown
  const fetchDoctors = async () => {
    try {
      console.log("Token:", localStorage.getItem("token"));
      const response = await fetch("/api/doctorsList", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDoctors(data);
      } else {
        console.error("Failed to fetch doctors");
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  // Fetch patients on mount and whenever filters change
  useEffect(() => {
    fetchPatients();
  }, [filters]);

  // Fetch doctors on mount
  useEffect(() => {
    fetchDoctors();
  }, []);

  // Handle filter input changes
  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      familyGroupId: "",
      assignedDoctorId: ""
    });
  };

  // Select a patient for detail view
  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
  };

  // Handle doctor assignment change in side panel dropdown
  const handleDoctorAssignmentChange = (e) => {
    if (selectedPatient) {
      setSelectedPatient({
        ...selectedPatient,
        assigned_doctor_id: e.target.value ? parseInt(e.target.value) : null
      });
    }
  };

  // Save doctor assignment update for selected patient
  const handleSaveAssignment = async () => {
    if (!selectedPatient) return;
    try {
      const response = await fetch(
        `/api/patients/${selectedPatient.id}/assign-doctor`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({
            assignedDoctorId: selectedPatient.assigned_doctor_id
          })
        }
      );
      if (response.ok) {
        const data = await response.json();
        alert("Doctor assignment updated successfully");
        setSelectedPatient(data.patient);
        fetchPatients(); // refresh list after update
      } else {
        const errorData = await response.json();
        alert("Failed to update doctor assignment: " + errorData.error);
      }
    } catch (error) {
      console.error("Error updating doctor assignment:", error);
      alert("Error updating doctor assignment");
    }
  };

  // Navigate back to homepage
  const handleBack = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Section: Filters & Patient List */}
      <div className="w-1/2 p-4">
        <h1 className="text-3xl font-bold mb-4">Doctor Dashboard</h1>
        <div className="mb-4 p-4 bg-gray-200 rounded">
          <h2 className="text-xl font-semibold mb-2">Search & Filter Patients</h2>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              name="firstName"
              value={filters.firstName}
              onChange={handleFilterChange}
              placeholder="First Name"
              className="p-2 border rounded"
            />
            <input
              type="text"
              name="lastName"
              value={filters.lastName}
              onChange={handleFilterChange}
              placeholder="Last Name"
              className="p-2 border rounded"
            />
            <input
              type="text"
              name="email"
              value={filters.email}
              onChange={handleFilterChange}
              placeholder="Email"
              className="p-2 border rounded"
            />
            <input
              type="text"
              name="phoneNumber"
              value={filters.phoneNumber}
              onChange={handleFilterChange}
              placeholder="Phone Number"
              className="p-2 border rounded"
            />
            <input
              type="text"
              name="familyGroupId"
              value={filters.familyGroupId}
              onChange={handleFilterChange}
              placeholder="Family Group ID"
              className="p-2 border rounded"
            />
            <input
              type="text"
              name="assignedDoctorId"
              value={filters.assignedDoctorId}
              onChange={handleFilterChange}
              placeholder="Assigned Doctor ID"
              className="p-2 border rounded"
            />
          </div>
          <div className="mt-2">
            <button onClick={clearFilters} className="px-4 py-2 bg-red-500 text-white rounded">
              Clear Filters
            </button>
          </div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-xl font-semibold mb-2">Patient List</h2>
          {patients.length === 0 ? (
            <p>No patients found.</p>
          ) : (
            <ul className="divide-y divide-gray-300">
              {patients.map((patient) => (
                <li key={patient.id} className="py-2 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">
                      {patient.first_name} {patient.last_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {patient.email} | {patient.phone_number}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSelectPatient(patient)}
                    className="px-3 py-1 bg-blue-500 text-white rounded"
                  >
                    View Patient
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Right Section: Patient Detail & Doctor Assignment */}
      <div className="w-1/2 p-4 bg-gray-100 border-l border-gray-300">
        {selectedPatient ? (
          <div className="bg-white rounded shadow p-4">
            <h2 className="text-2xl font-semibold mb-4">Patient Details</h2>
            <p>
              <strong>Name:</strong> {selectedPatient.first_name} {selectedPatient.last_name}
            </p>
            <p>
              <strong>Email:</strong> {selectedPatient.email}
            </p>
            <p>
              <strong>Phone:</strong> {selectedPatient.phone_number}
            </p>
            <p>
              <strong>Gender:</strong> {selectedPatient.gender}
            </p>
            <p>
              <strong>Age:</strong> {selectedPatient.age}
            </p>
            <p>
              <strong>Family Group ID:</strong> {selectedPatient.family_group_id || "N/A"}
            </p>
            <p>
              <strong>Assigned Doctor ID:</strong>{" "}
              {selectedPatient.assigned_doctor_id || "Not Assigned"}
            </p>

            <div className="mt-4">
              <label className="block font-semibold mb-1">Assign Doctor:</label>
              <select
                value={selectedPatient.assigned_doctor_id || ""}
                onChange={handleDoctorAssignmentChange}
                className="p-2 border rounded w-full"
              >
                <option value="">Select a doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.first_name} {doctor.last_name} - {doctor.specialty}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 flex space-x-2">
              <button
                onClick={handleSaveAssignment}
                className="px-4 py-2 bg-green-500 text-white rounded"
              >
                Save Assignment
              </button>
              <button
                onClick={() => setSelectedPatient(null)}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                Close Details
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xl">Select a patient to view details.</p>
        )}
        <button
          onClick={handleBack}
          className="mt-8 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
        >
          Back to Homepage
        </button>
      </div>
    </div>
  );
};

export default DoctorDashboard;
