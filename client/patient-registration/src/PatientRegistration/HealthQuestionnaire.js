import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API_BASE_URL from "../config";

const HealthQuestionnaire = () => {
  const navigate = useNavigate();
  const { patientId } = useParams();

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch questions from backend
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/questions`)
      .then((res) => res.json())
      .then((data) => {
        setQuestions(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching questions:", err);
        setLoading(false);
      });
  }, []);

  const handleChange = (fieldName, value) => {
    setAnswers({ ...answers, [fieldName]: value });
  };

  const shouldShow = (question) => {
    if (!question.parent_question_id) return true; // Always show top-level questions
    const parent = questions.find((q) => q.id === question.parent_question_id);
    if (!parent) return false;
    return answers[parent.field_name] === question.trigger_value;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/submit-health-questionnaire`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...answers, patientId }),
      });

      if (response.ok) {
        alert("✅ Questionnaire submitted!");
        navigate("/");
      } else {
        const data = await response.json();
        console.error(data);
        alert("❌ Submission failed");
      }
    } catch (err) {
      console.error("Error submitting questionnaire:", err);
      alert("An error occurred while submitting the form.");
    }
  };

  if (loading) {
    return <div className="text-white text-center mt-10">Loading questions...</div>;
  }

  const groupedByCategory = questions.reduce((acc, q) => {
    if (!acc[q.category]) acc[q.category] = [];
    acc[q.category].push(q);
    return acc;
  }, {});

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900">
      <div className="max-w-3xl w-full bg-gradient-to-br from-purple-700 to-indigo-700 p-10 rounded-lg shadow-lg text-white">
        <h2 className="text-3xl font-bold text-center mb-6">Health Questionnaire</h2>
        <form onSubmit={handleSubmit} className="space-y-6">

          {Object.entries(groupedByCategory).map(([category, group]) => (
            <div key={category}>
              <h3 className="text-xl font-semibold mb-4">{category}</h3>
              {group.map((q) => {
                if (!shouldShow(q)) return null;

                return (
                  <div key={q.id} className="mb-4">
                    <label className="block text-sm font-medium mb-1">{q.question}</label>
                    <select
                      name={q.field_name}
                      value={answers[q.field_name] || ""}
                      onChange={(e) => handleChange(q.field_name, e.target.value)}
                      className="w-full p-2 bg-purple-100 text-black border rounded"
                      required
                    >
                      <option value="">Select</option>
                      {q.options.map((opt, i) => (
                        <option key={i} value={opt}>{opt}</option>
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
      </div>
    </div>
  );
};

export default HealthQuestionnaire;
