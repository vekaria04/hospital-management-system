import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API_BASE_URL from "../config";
import { saveOfflineData } from "../utils/localStore";
import useNetworkStatus from "../utils/useNetworkStatus";

const HealthQuestionnaire = () => {
  const isOffline = useNetworkStatus();
  const navigate = useNavigate();
  const { patientId } = useParams();

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState("en");

  // Fetch questions from backend with selected language
  const fetchQuestions = async (lang) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/questions?lang=${lang}`);
      const data = await res.json();
      setQuestions(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching questions:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions(language);
  }, [language]);

  const handleChange = (fieldName, value) => {
    setAnswers({ ...answers, [fieldName]: value });
  };

  const shouldShow = (question) => {
    if (!question.parent_question_id) return true;
    const parent = questions.find((q) => q.id === question.parent_question_id);
    if (!parent) return false;
    return answers[parent.field_name] === question.trigger_value;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = { ...answers, patientId };

    if (isOffline) {
      // Save payload offline for later sync
      await saveOfflineData({
        url: `${API_BASE_URL}/api/submit-health-questionnaire`,
        method: "POST",
        body: payload,
        timestamp: Date.now(),
      });
      alert(
        "You're offline. Your questionnaire has been saved locally and will sync when you're online."
      );
      navigate("/");
      return;
    }

    // Existing online submission flow
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/submit-health-questionnaire`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        alert("✅ Questionnaire submitted!");
        navigate("/");
      } else {
        const data = await response.json();
        console.error(data);
        alert("❌ Submission failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error submitting questionnaire:", err);
      alert("An error occurred while submitting the form.");
    }
  };

  const groupedByCategory = questions.reduce((acc, q) => {
    if (!acc[q.category]) acc[q.category] = [];
    acc[q.category].push(q);
    return acc;
  }, {});

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900">
      <div className="max-w-3xl w-full bg-gradient-to-br from-purple-700 to-indigo-700 p-10 rounded-lg shadow-lg text-white">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-center w-full">
            Health Questionnaire
          </h2>
          <select
            value={language}
            onChange={(e) => {
              setLoading(true);
              setLanguage(e.target.value);
            }}
            className="absolute top-6 right-6 bg-purple-100 text-black px-2 py-1 rounded"
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="hi">हिंदी</option>
            <option value="es">Español</option>
            <option value="zh-cn">中文</option>
          </select>
        </div>

        {loading ? (
          <div className="text-white text-center mt-10">
            Loading questions...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {Object.entries(groupedByCategory).map(([category, group]) => (
              <div key={category}>
                <h3 className="text-xl font-semibold mb-4">{category}</h3>
                {group.map((q) => {
                  if (!shouldShow(q)) return null;

                  return (
                    <div key={q.id} className="mb-4">
                      <label className="block text-sm font-medium mb-1">
                        {q.question}
                      </label>
                      <select
                        name={q.field_name}
                        value={answers[q.field_name] || ""}
                        onChange={(e) =>
                          handleChange(q.field_name, e.target.value)
                        }
                        className="w-full p-2 bg-purple-100 text-black border rounded"
                        required
                      >
                        <option value="">Select</option>
                        {q.options.map((opt, i) => (
                          <option key={i} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            ))}

            <button
              type="submit"
              className="w-full py-3 px-6 bg-orange-500 text-white font-semibold rounded-md hover:bg-orange-600 shadow-md"
            >
              Submit
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default HealthQuestionnaire;
