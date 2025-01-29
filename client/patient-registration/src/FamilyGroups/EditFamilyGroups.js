import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const EditFamilyGroups = () => {
  const [email, setEmail] = useState("");
  const [familyGroup, setFamilyGroup] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const fetchFamilyGroup = async () => {
    setError("");
    setIsLoading(true);

    try {
      const response = await axios.get(`/api/family-group/${email}`);

      const mappedPrimaryMember = {
        ...response.data.primaryMember,
        firstName: response.data.primaryMember.first_name,
        lastName: response.data.primaryMember.last_name,
        phoneNumber: response.data.primaryMember.phone_number,
      };

      const mappedFamilyMembers = response.data.familyMembers.map((member) => ({
        ...member,
        firstName: member.first_name,
        lastName: member.last_name,
        phoneNumber: member.phone_number,
      }));

      setFamilyGroup({
        primaryMember: mappedPrimaryMember,
        familyMembers: mappedFamilyMembers,
      });
    } catch (err) {
      setError("Failed to fetch family group. Please check the email.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (index, field, value) => {
    setFamilyGroup((prev) => {
      const updatedMembers = prev.familyMembers.map((member, i) =>
        i === index ? { ...member, [field]: value || "" } : member
      );
      return { ...prev, familyMembers: updatedMembers };
    });
  };

  const removeFamilyMember = async (id) => {
    setError("");
    setIsLoading(true);

    try {
      await axios.delete(`/api/family-group/remove-member/${id}`);
      setFamilyGroup((prev) => ({
        ...prev,
        familyMembers: prev.familyMembers.filter((member) => member.id !== id),
      }));
      alert("Family member removed successfully.");
    } catch (err) {
      setError("Failed to remove family member.");
    } finally {
      setIsLoading(false);
    }
  };

  const updateMember = async (member) => {
    if (!member.firstName || !member.lastName) {
      setError("First and last name cannot be empty.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await axios.put(`/api/family-group/update-member/${member.id}`, {
        firstName: member.firstName,
        lastName: member.lastName,
        gender: member.gender,
        age: member.age,
        phoneNumber: member.phoneNumber,
        email: member.email,
        address: member.address,
      });
      alert("Member updated successfully!");
    } catch (err) {
      setError("Failed to update family member. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const navigateHome = () => {
    navigate("/");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900">
      <div className="max-w-lg w-full bg-gradient-to-br from-purple-700 to-indigo-700 p-8 rounded-lg shadow-lg text-white">
        <h1 className="text-3xl font-bold text-center mb-6">Edit Family Groups</h1>

        {/* Email Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium">Retrieve Family Group</label>
          <div className="flex">
            <input
              type="text"
              placeholder="Enter Primary Member's Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-2 bg-purple-100 text-black border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <button
              onClick={fetchFamilyGroup}
              className="ml-2 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Retrieve"}
            </button>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {familyGroup && (
          <div>
            <h2 className="text-xl font-bold mt-4">Primary Member</h2>
            <p className="mt-2 bg-green-600 p-4 rounded-md">
              {familyGroup.primaryMember.firstName} {familyGroup.primaryMember.lastName} <br />
              Email: {familyGroup.primaryMember.email}
            </p>

            <h2 className="text-xl font-bold mt-4">Family Members</h2>
            {familyGroup.familyMembers.length === 0 ? (
              <p className="mt-2 bg-yellow-500 p-4 rounded-md">No family members found.</p>
            ) : (
              familyGroup.familyMembers.map((member, index) => (
                <div key={index} className="bg-green-600 p-4 rounded-md mt-4">
                  <h3 className="font-semibold">Member {index + 1}</h3>
                  <input
                    type="text"
                    placeholder="First Name"
                    value={member.firstName}
                    onChange={(e) =>
                      handleInputChange(index, "firstName", e.target.value)
                    }
                    className="block w-full px-4 py-2 bg-purple-100 text-black border border-gray-300 rounded-md mt-2"
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={member.lastName}
                    onChange={(e) =>
                      handleInputChange(index, "lastName", e.target.value)
                    }
                    className="block w-full px-4 py-2 bg-purple-100 text-black border border-gray-300 rounded-md mt-2"
                  />
                  <button
                    onClick={() => updateMember(member)}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Update Member
                  </button>
                  <button
                    onClick={() => removeFamilyMember(member.id)}
                    className="mt-4 ml-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    Remove Member
                  </button>
                </div>
              ))
            )}
          </div>
        )}

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

export default EditFamilyGroups;
