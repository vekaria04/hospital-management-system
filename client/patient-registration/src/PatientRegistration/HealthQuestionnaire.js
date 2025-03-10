import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API_BASE_URL from "../config";
const HealthQuestionnaire = () => {
  const navigate = useNavigate();
  const { patientId } = useParams();

  const [formData, setFormData] = useState({
    allergies: "",
    primaryLanguage: "",
    otherPrimaryLanguage: "",
    preferredLanguage: "",
    otherPreferredLanguage: "",
    primaryConcern: "",
    symptomDuration: "",
    symptomTriggers: "",
    painLevel: "",
    chronicConditions: "",
    pastSurgeries: "",
    medications: "",
    familyHistory: "",
    diet: "",
    substanceUse: "",
    physicalActivity: "",
    menstrualCycle: "",
    pregnancyStatus: "",
    mentalHealth: "",
    sleepConcerns: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.primaryLanguage)
      newErrors.primaryLanguage = "Primary language is required.";
    if (!formData.primaryConcern)
      newErrors.primaryConcern = "Primary concern is required.";
    if (
      formData.painLevel &&
      (formData.painLevel < 1 || formData.painLevel > 10)
    ) {
      newErrors.painLevel = "Pain level must be between 1 and 10.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/submit-health-questionnaire`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, patientId }),
      });

      if (response.ok) {
        alert("Health questionnaire submitted successfully!");
        navigate("/");
      } else {
        alert("Failed to submit the health questionnaire.");
      }
    } catch (error) {
      console.error("Error submitting questionnaire:", error);
      alert("An error occurred while submitting the health questionnaire.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900">
      <div className="max-w-2xl w-full bg-gradient-to-br from-purple-700 to-indigo-700 p-10 rounded-lg shadow-lg text-white">
        <h2 className="text-3xl font-bold text-center mb-6">
          Health Questionnaire
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {Object.entries({
            allergies:
              "Do you have any known allergies (medications, food, environmental)?",
            primaryLanguage: "What is your primary language?",
            preferredLanguage:
              "Would you prefer assistance in another language?",
            primaryConcern:
              "What brings you in today? Please describe your primary concern or symptoms.",
            symptomDuration:
              "How long have you been experiencing these symptoms?",
            symptomTriggers:
              "Have you noticed anything that improves or worsens your symptoms?",
            painLevel:
              "Are you currently experiencing pain? If so, how would you rate it on a scale of 1 to 10?",
            chronicConditions:
              "Do you have any chronic medical conditions (e.g., diabetes, hypertension, asthma)?",
            pastSurgeries:
              "Have you had any surgeries or hospitalizations in the past?",
            medications:
              "Are you currently taking any medications, including over-the-counter or supplements?",
            familyHistory:
              "Is there any family history of medical conditions such as heart disease, cancer, or genetic disorders?",
            diet: "How would you describe your diet? Do you follow any specific dietary restrictions or plans?",
            substanceUse:
              "Do you smoke or use tobacco products? Do you consume alcohol? If yes, how frequently and in what quantity?",
            physicalActivity:
              "How often do you engage in physical activity or exercise?",
            menstrualCycle:
              "When was your last menstrual period? Do you have a regular menstrual cycle?",
            pregnancyStatus:
              "Are you currently pregnant, planning to become pregnant, or unsure?",
            mentalHealth:
              "Have you been experiencing feelings of stress, anxiety, or depression recently?",
            sleepConcerns:
              "Do you have any concerns about your sleep quality or patterns?",
          }).map(([field, question]) => (
            <div key={field}>
              <label className="block text-sm font-medium text-white">
                {question}
              </label>
              {errors[field] && (
                <p className="text-red-400 text-sm">{errors[field]}</p>
              )}
              {field === "primaryLanguage" || field === "preferredLanguage" ? (
                <>
                  <select
                    name={field}
                    value={formData[field]}
                    onChange={handleChange}
                    className="w-full p-2 bg-purple-100 text-black border rounded"
                  >
                    <option value="">Select</option>
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="Other">Other</option>
                  </select>
                  {formData[field] === "Other" && (
                    <input
                      type="text"
                      name={
                        field === "primaryLanguage"
                          ? "otherPrimaryLanguage"
                          : "otherPreferredLanguage"
                      }
                      value={
                        field === "primaryLanguage"
                          ? formData.otherPrimaryLanguage
                          : formData.otherPreferredLanguage
                      }
                      onChange={handleChange}
                      placeholder="Please specify"
                      className="w-full p-2 bg-purple-100 text-black border rounded mt-2"
                    />
                  )}
                </>
              ) : field === "pregnancyStatus" ? (
                <select
                  name={field}
                  value={formData[field] || ""}
                  onChange={handleChange}
                  className="w-full p-2 bg-purple-100 text-black border rounded"
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Unknown">Unknown</option>
                </select>
              ) : (
                <input
                  type={field === "painLevel" ? "number" : "text"}
                  name={field}
                  value={formData[field] || ""}
                  onChange={handleChange}
                  className="w-full p-2 bg-purple-100 text-black border rounded"
                  min={field === "painLevel" ? 1 : undefined}
                  max={field === "painLevel" ? 10 : undefined}
                />
              )}
            </div>
          ))}
          {Object.keys(errors).length > 0 && (
            <p className="text-red-400 text-sm text-center">
              Please fix the errors above before submitting.
            </p>
          )}
          <button
            type="submit"
            className="w-full py-3 px-6 bg-orange-500 text-white font-semibold rounded-md hover:bg-orange-600 shadow-md focus:ring-2 focus:ring-orange-400"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default HealthQuestionnaire;
