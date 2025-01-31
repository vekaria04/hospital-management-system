import React, { useState, useEffect } from "react";
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
      const response = await fetch(`/api/family-group/${email}`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(
          "Failed to fetch family group. Please check the email."
        );
      }

      const data = await response.json();

      setFamilyGroup({
        primaryMember: { ...data.primaryMember },
        familyMembers: data.familyMembers.map((member) => ({
          id: member.id,
          firstName: member.first_name || "",
          lastName: member.last_name || "",
          phone: member.phone_number || "",
          email: member.email || "",
          address: member.address || "",
        })),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (index, field, value) => {
    setFamilyGroup((prev) => {
      if (!prev) return prev;
      const updatedMembers = prev.familyMembers.map((member, i) =>
        i === index ? { ...member, [field]: value } : member
      );
      return { ...prev, familyMembers: updatedMembers };
    });
  };

  const removeFamilyMember = async (id) => {
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`/api/family-group/remove-member/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove family member.");
      }

      setFamilyGroup((prev) => ({
        ...prev,
        familyMembers: prev.familyMembers.filter((member) => member.id !== id),
      }));

      alert("Family member removed successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateMember = async (member) => {
    if (
      !member.firstName ||
      !member.lastName ||
      !member.phone ||
      !member.email ||
      !member.address
    ) {
      setError("All fields must be filled.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/family-group/update-member/${member.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: member.firstName,
            lastName: member.lastName,
            phone: member.phone,
            email: member.email,
            address: member.address,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update family member. Please try again.");
      }

      alert("Member updated successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900">
      <div className="max-w-lg w-full bg-gradient-to-br from-purple-700 to-indigo-700 p-8 rounded-lg shadow-lg text-white">
        <h1 className="text-3xl font-bold text-center mb-6">
          Edit Family Groups
        </h1>

        <div className="mb-4">
          <label className="block text-sm font-medium">
            Retrieve Family Group
          </label>
          <div className="flex">
            <input
              type="text"
              placeholder="Enter Primary Member's Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-2 bg-purple-100 text-black border border-gray-300 rounded-md shadow-sm focus:outline-none"
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
            <h2 className="text-xl font-bold mt-4">Family Members</h2>
            {familyGroup.familyMembers.map((member, index) => (
              <div key={index} className="bg-green-600 p-4 rounded-md mt-4">
                {["firstName", "lastName", "phone", "email", "address"].map(
                  (field) => (
                    <input
                      key={field}
                      type="text"
                      placeholder={
                        field.charAt(0).toUpperCase() + field.slice(1)
                      }
                      value={member[field] || ""}
                      onChange={(e) =>
                        handleInputChange(index, field, e.target.value)
                      }
                      className="block w-full px-4 py-2 bg-purple-100 text-black border border-gray-300 rounded-md mt-2"
                    />
                  )
                )}
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
            ))}
          </div>
        )}

        <button
          onClick={() => navigate("/")}
          className="w-full py-3 px-6 mt-6 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600"
        >
          Home
        </button>
      </div>
    </div>
  );
};

export default EditFamilyGroups;
