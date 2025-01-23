import React, { useState } from "react";

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

    const [errors, setErrors] = useState({});

    const validate = () => {
        const newErrors = {};
        if (!formData.firstName) newErrors.firstName = "First name is required";
        if (!formData.lastName) newErrors.lastName = "Last name is required";
        if (!formData.gender) newErrors.gender = "Gender is required";
        if (!formData.age || formData.age <= 0) newErrors.age = "Age must be a positive number";
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
            const response = await fetch("/api/register-patient", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (response.ok) {
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
            } else {
                const errorData = await response.json();
                alert(`Failed to register patient: ${errorData.error || "Unknown error"}`);
            }
        } catch (error) {
            console.error("Error submitting form:", error);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900">
            <div className="max-w-lg w-full bg-gradient-to-br from-purple-700 to-indigo-700 p-8 rounded-lg shadow-lg text-white">
                <h1 className="text-3xl font-bold text-center mb-6">Patient Registration</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {["firstName", "lastName", "gender", "age", "phoneNumber", "email", "address"].map(
                        (field) => (
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
                        )
                    )}
                    <button
                        type="submit"
                        className="w-full py-3 px-6 rounded-md bg-orange-500 text-white font-semibold shadow-md hover:bg-orange-600 focus:ring-2 focus:ring-orange-400"
                    >
                        Submit
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PatientRegistrationForm;
