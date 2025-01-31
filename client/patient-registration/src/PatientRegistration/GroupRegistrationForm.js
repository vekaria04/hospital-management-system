import React, { useState } from "react";
import { BrowserRouter as useNavigate } from "react-router-dom";

const GroupRegistrationForm = () => {
  const [primaryEmail, setPrimaryEmail] = useState("");
  const [primaryPatient, setPrimaryPatient] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]); // Array of new family member objects
  const [newMember, setNewMember] = useState({
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
  // Function to retrieve primary patient data
  const fetchPrimaryPatient = async () => {
    if (!primaryEmail) {
      alert("Please enter a valid email.");
      return;
    }

    try {
      const response = await fetch(`/api/returning-patient/${primaryEmail}`, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || "Error fetching primary patient.");
        return;
      }

      const data = await response.json();
      setPrimaryPatient(data);
      alert("Primary patient retrieved successfully!");
    } catch (error) {
      console.error("Error fetching primary patient:", error);
      alert("An error occurred while fetching the primary patient.");
    }
  };

  // Function to handle form input for a new family member
  const handleNewMemberChange = (e) => {
    const { name, value } = e.target;
    setNewMember({ ...newMember, [name]: value });
  };

  const handleAddMember = () => {
    console.log("New Member Data:", newMember); // Debugging: Check current state of newMember

    const { firstName, lastName, gender, age, phoneNumber, email } = newMember;

    // Validate required fields
    if (!firstName || !lastName || !email || !gender || !age || !phoneNumber) {
      alert("Please fill out all required fields for the new member.");
      return;
    }

    // Add the new member to the list
    setFamilyMembers([...familyMembers, newMember]);

    // Reset the form for the next member
    setNewMember({
      firstName: "",
      lastName: "",
      gender: "",
      age: "",
      phoneNumber: "",
      email: "",
      address: "", // Optional field
    });
  };

  // Function to submit the group registration
  const handleSubmit = async () => {
    if (!primaryPatient) {
      alert("Please retrieve the primary patient first.");
      return;
    }

    if (familyMembers.length === 0) {
      alert("Please add at least one family member.");
      return;
    }

    // Transform primaryPatient fields to match expected camelCase structure
    const transformedPrimaryMember = {
      firstName: primaryPatient.first_name,
      lastName: primaryPatient.last_name,
      gender: primaryPatient.gender,
      age: primaryPatient.age,
      phoneNumber: primaryPatient.phone_number,
      email: primaryPatient.email,
      address: primaryPatient.address,
    };

    // Debugging: Log final payload
    console.log("Submitting Family Registration:", {
      primaryMember: transformedPrimaryMember,
      familyMembers,
    });

    try {
      const response = await fetch("/api/register-family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryMember: transformedPrimaryMember,
          familyMembers,
        }),
      });

      if (response.ok) {
        alert("Family group registered successfully!");
        setPrimaryPatient(null); // Reset primary patient
        setFamilyMembers([]); // Clear added members
      } else {
        const errorData = await response.json();
        alert(
          `Error registering family: ${errorData.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Error registering family:", error);
      alert("An error occurred while registering the family.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900">
      <div className="max-w-2xl w-full bg-gradient-to-br from-purple-700 to-indigo-700 p-8 rounded-lg shadow-lg text-white">
        <h1 className="text-3xl font-bold text-center mb-6">
          Group Registration
        </h1>

        {/* Primary Patient Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Enter Primary Patient Email
          </label>
          <div className="flex">
            <input
              type="text"
              placeholder="Enter email"
              value={primaryEmail}
              onChange={(e) => setPrimaryEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-2 bg-purple-100 text-black border border-gray-300 rounded-md shadow-sm focus:outline-none"
            />
            <button
              type="button"
              onClick={fetchPrimaryPatient}
              className="ml-2 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
            >
              Retrieve
            </button>
          </div>
          {primaryPatient && (
            <div className="bg-green-600 p-4 rounded-md mt-4">
              <p className="text-lg font-semibold">Primary Patient:</p>
              <p>
                {primaryPatient.first_name} {primaryPatient.last_name}
              </p>
              <p>Email: {primaryPatient.email}</p>
            </div>
          )}
        </div>

        {/* Add Family Members Section */}
        <h2 className="text-xl font-bold mb-4">Add Family Members</h2>
        <div className="space-y-4">
          {familyMembers.map((member, index) => (
            <div key={index} className="bg-green-600 p-4 rounded-md">
              <p className="font-semibold">Member {index + 1}:</p>
              <p>
                Name: {member.firstName} {member.lastName}
              </p>
              <p>Email: {member.email}</p>
            </div>
          ))}
        </div>

        {/* New Member Form */}
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">New Family Member</h3>

          {/* First Name */}
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            value={newMember.firstName}
            onChange={handleNewMemberChange}
            className="block w-full px-4 py-2 bg-purple-100 text-black border border-gray-300 rounded-md mt-2"
          />

          {/* Last Name */}
          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            value={newMember.lastName}
            onChange={handleNewMemberChange}
            className="block w-full px-4 py-2 bg-purple-100 text-black border border-gray-300 rounded-md mt-2"
          />

          {/* Gender */}
          <select
            name="gender"
            value={newMember.gender}
            onChange={handleNewMemberChange}
            className="block w-full px-4 py-2 bg-purple-100 text-black border border-gray-300 rounded-md mt-2"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>

          {/* Age */}
          <input
            type="number"
            name="age"
            placeholder="Age"
            value={newMember.age}
            onChange={handleNewMemberChange}
            className="block w-full px-4 py-2 bg-purple-100 text-black border border-gray-300 rounded-md mt-2"
          />

          {/* Phone Number */}
          <input
            type="text"
            name="phoneNumber"
            placeholder="Phone Number"
            value={newMember.phoneNumber}
            onChange={handleNewMemberChange}
            className="block w-full px-4 py-2 bg-purple-100 text-black border border-gray-300 rounded-md mt-2"
          />

          {/* Email */}
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={newMember.email}
            onChange={handleNewMemberChange}
            className="block w-full px-4 py-2 bg-purple-100 text-black border border-gray-300 rounded-md mt-2"
          />

          {/* Address */}
          <textarea
            name="address"
            placeholder="Address"
            value={newMember.address}
            onChange={handleNewMemberChange}
            className="block w-full px-4 py-2 bg-purple-100 text-black border border-gray-300 rounded-md mt-2"
            rows="2"
          ></textarea>

          {/* Add Member Button */}
          <button
            type="button"
            onClick={handleAddMember}
            className="w-full py-2 px-4 mt-4 bg-orange-500 text-white rounded-md hover:bg-orange-600"
          >
            Add Member
          </button>
        </div>

        {/* Submit Group Button */}
        <button
          onClick={handleSubmit}
          className="w-full py-3 px-6 mt-6 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600"
        >
          Submit Group
        </button>
        {/* Navigate Home */}
        <button
          onClick={navigateHome}
          className="w-full py-3 px-6 mt-6 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600"
        >
          Home
        </button>
      </div>
    </div>
  );
};

export default GroupRegistrationForm;
