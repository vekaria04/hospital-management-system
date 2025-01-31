import React, { useState } from "react";
import { BrowserRouter as useNavigate } from "react-router-dom";

const PatientRegistrationForm = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    age: "",
    phoneNumber: "",
    email: "",
    address: "",
  });
  const navigate = useNavigate();
  const navigateHome = () => {
    navigate("/");
  };
  const [errors, setErrors] = useState({});
  const [email, setEmail] = useState(""); // Email input for fetching existing data
  const [existingPatientId, setExistingPatientId] = useState(null); // Track if patient exists for updates

  const handleFetchData = async () => {
    try {
      const response = await fetch(`/api/returning-patient/${email}`);
      if (response.ok) {
        const data = await response.json();
        setFormData({
          firstName: data.first_name,
          lastName: data.last_name,
          gender: data.gender,
          age: data.age,
          phoneNumber: data.phone_number,
          email: data.email,
          address: data.address,
        });
        setExistingPatientId(data.id); // Store existing patient ID for updating
      } else {
        alert("Patient not found. You can register a new patient.");
        setExistingPatientId(null); // No existing patient found
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.lastName) newErrors.lastName = "Last name is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.age || formData.age <= 0)
      newErrors.age = "Age must be a positive number";
    if (!formData.phoneNumber || !/^\d+$/.test(formData.phoneNumber))
      newErrors.phoneNumber = "Phone number must be valid";
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email must be valid";
    return newErrors;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    try {
      if (existingPatientId) {
        // If patient exists, update record
        const response = await fetch(
          `/api/update-patient/${existingPatientId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          }
        );

        if (response.ok) {
          alert("Patient details updated successfully!");
        } else {
          const errorData = await response.json();
          alert(
            `Failed to update patient: ${errorData.error || "Unknown error"}`
          );
        }
      } else {
        // Otherwise, register a new patient
        const response = await fetch("/api/register-patient", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await response.json();
        console.log("🔹 API Response:", data); // Debugging to see if data.patient exists

        if (response.ok && data.patient && data.patient.id) {
          alert("Patient registered successfully!");
          setFormData({
            firstName: "",
            lastName: "",
            gender: "",
            age: "",
            phoneNumber: "",
            email: "",
            address: "",
          });
          navigate(`/health-questionnaire/${data.patient.id}`);
        } else {
          alert("Unexpected response from server. Please try again.");
          console.error("Unexpected response:", data);
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("An error occurred while submitting the form.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900">
      <div className="max-w-lg w-full bg-gradient-to-br from-purple-700 to-indigo-700 p-8 rounded-lg shadow-lg text-white">
        <h1 className="text-3xl font-bold text-center mb-6">
          Patient Registration
        </h1>

        {/* Returning Patient Lookup */}
        <div className="mb-4">
          <label className="block text-sm font-medium">
            Retrieve Existing Patient Data
          </label>
          <div className="flex">
            <input
              type="text"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-2 bg-purple-100 text-black border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <button
              type="button"
              onClick={handleFetchData}
              className="ml-2 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
            >
              Retrieve
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            "firstName",
            "lastName",
            "gender",
            "age",
            "phoneNumber",
            "email",
            "address",
          ].map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium capitalize">
                {field.replace(/([A-Z])/g, " $1")}
              </label>
              {field === "gender" ? (
                <select
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 bg-purple-100 text-black border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  required
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              ) : field === "address" ? (
                <textarea
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 bg-purple-100 text-black border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  rows="3"
                ></textarea>
              ) : (
                <input
                  type={field === "age" ? "number" : "text"}
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 bg-purple-100 text-black border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              )}
              {errors[field] && (
                <p className="text-red-400 text-sm mt-1">{errors[field]}</p>
              )}
            </div>
          ))}
          <button
            type="submit"
            className={`w-full py-3 px-6 rounded-md text-white font-semibold shadow-md focus:ring-2 focus:ring-orange-400 ${
              existingPatientId
                ? "bg-blue-500 hover:bg-blue-600"
                : "bg-orange-500 hover:bg-orange-600"
            }`}
          >
            {existingPatientId ? "Update" : "Submit"}
          </button>
          {/* Navigate Home */}
          <button
            onClick={navigateHome}
            className="w-full py-3 px-6 mt-6 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600"
          >
            Home
          </button>
        </form>
      </div>
    </div>
  );
};

export default PatientRegistrationForm;
