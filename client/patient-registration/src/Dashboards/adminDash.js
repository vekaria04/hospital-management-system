import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [editDoctor, setEditDoctor] = useState(null);
  const [editQuestion, setEditQuestion] = useState(null);
  const [newDoctor, setNewDoctor] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    specialty: "",
    password: ""
  });
  const [doctorForm, setDoctorForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    specialty: ""
  });
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    category: "",
    field_name: "",
    options: "",
    parent_question_id: "",
    trigger_value: ""
  });
  // Analytics state variable from the comprehensive summary endpoint
  const [summaryMetrics, setSummaryMetrics] = useState(null);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    fetchDoctors();
    fetchQuestions();
    fetchAnalytics();
  }, []);

  const getToken = () => localStorage.getItem("token");

  const fetchDoctors = () => {
    const token = getToken();
    if (!token) return navigate("/login");

    fetch(`${API_BASE_URL}/api/doctors`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setDoctors(data))
      .catch(err => console.error("Error fetching doctors:", err));
  };

  const fetchQuestions = () => {
    fetch(`${API_BASE_URL}/api/questions`)
      .then(res => res.json())
      .then(data => setQuestions(data))
      .catch(err => console.error("Error fetching questions:", err));
  };

  const fetchAnalytics = () => {
    const token = getToken();
    fetch(`${API_BASE_URL}/api/metrics/summary`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setSummaryMetrics(data))
      .catch(err => console.error("Error fetching summary metrics:", err));
  };

  const handleAddDoctor = () => {
    const token = getToken();
    fetch(`${API_BASE_URL}/api/doctors`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(newDoctor)
    })
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          fetchDoctors();
          fetchAnalytics();
          setNewDoctor({
            firstName: "",
            lastName: "",
            email: "",
            phoneNumber: "",
            specialty: "",
            password: ""
          });
        }
      })
      .catch(err => console.error("Error adding doctor:", err));
  };

  const handleEditDoctor = (doctor) => {
    setEditDoctor(doctor.id);
    setDoctorForm({
      firstName: doctor.first_name,
      lastName: doctor.last_name,
      email: doctor.email,
      phoneNumber: doctor.phone_number,
      specialty: doctor.specialty
    });
  };

  const handleSaveEdit = () => {
    const token = getToken();
    fetch(`${API_BASE_URL}/api/doctors/${editDoctor}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(doctorForm)
    })
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setDoctors(doctors.map(d => (d.id === editDoctor ? { ...d, ...data.doctor } : d)));
          setEditDoctor(null);
        }
      })
      .catch(err => console.error("Error updating doctor:", err));
  };

  const handleRemoveDoctor = (id) => {
    const token = getToken();
    fetch(`${API_BASE_URL}/api/doctors/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(() => {
        setDoctors(doctors.filter(doc => doc.id !== id));
        fetchAnalytics();
      })
      .catch(err => console.error("Error deleting doctor:", err));
  };

  const handleAddQuestion = () => {
    const token = getToken();
    const questionData = {
      ...newQuestion,
      options: newQuestion.options.split(",").map(opt => opt.trim())
    };

    fetch(`${API_BASE_URL}/api/questions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(questionData)
    })
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setQuestions([...questions, data.question]);
          setNewQuestion({
            question: "",
            category: "",
            field_name: "",
            options: "",
            parent_question_id: "",
            trigger_value: ""
          });
        }
      })
      .catch(err => console.error("Error adding question:", err));
  };

  const handleEditQuestion = (q) => {
    setEditQuestion(q.id);
    setNewQuestion({
      question: q.question,
      category: q.category,
      field_name: q.field_name,
      options: q.options.join(", "),
      parent_question_id: q.parent_question_id || "",
      trigger_value: q.trigger_value || ""
    });
  };

  const handleSaveEditQuestion = () => {
    const token = getToken();
    const updated = {
      ...newQuestion,
      options: newQuestion.options.split(",").map(o => o.trim())
    };

    fetch(`${API_BASE_URL}/api/questions/${editQuestion}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(updated)
    })
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setQuestions(questions.map(q => (q.id === editQuestion ? data.question : q)));
          setEditQuestion(null);
          setNewQuestion({
            question: "",
            category: "",
            field_name: "",
            options: "",
            parent_question_id: "",
            trigger_value: ""
          });
        }
      })
      .catch(err => console.error("Error updating question:", err));
  };

  const handleDeleteQuestion = (id) => {
    const token = getToken();
    fetch(`${API_BASE_URL}/api/questions/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(() => setQuestions(questions.filter(q => q.id !== id)))
      .catch(err => console.error("Error deleting question:", err));
  };

  const handleFieldNameAutoGen = (val) => {
    const autoFieldName = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
    setNewQuestion({ ...newQuestion, question: val, field_name: autoFieldName });
  };

  const fetchAuditLogs = () => {
    const token = getToken();
    fetch(`${API_BASE_URL}/api/audit-logs`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setAuditLogs)
      .catch(err => console.error("Error fetching logs:", err));
  };

  const toggleAuditLogs = () => {
    if (!showLogs) fetchAuditLogs();
    setShowLogs(!showLogs);
  };

  return (
    <div className="text-white p-4 space-y-8 bg-gradient-to-br from-purple-900 to-indigo-900 min-h-screen">
      <h1 className="text-4xl font-bold">Admin Dashboard</h1>
      <button
        onClick={() => navigate("/reports")}
        className="bg-blue-600 px-4 py-2 rounded mb-4"
      >
        View Patient Reports
      </button>
      {/* Analytics Section */}
      <div className="bg-purple-700 p-4 rounded shadow">
        <h2 className="text-2xl font-semibold mb-2">Analytics Metrics</h2>
        {summaryMetrics ? (
          <div className="space-y-6">
            {/* Totals */}
            <div className="flex justify-around">
              <div>
                <p className="text-xl">Total Patients</p>
                <p className="text-2xl">
                  {summaryMetrics?.totals?.total_patients ?? 0}
                </p>
              </div>
              <div>
                <p className="text-xl">Total Doctors</p>
                <p className="text-2xl">
                  {summaryMetrics?.totals?.total_doctors ?? 0}
                </p>
              </div>
              <div>
                <p className="text-xl">Total Family Groups</p>
                <p className="text-2xl">
                  {summaryMetrics?.totals?.total_family_groups ?? 0}
                </p>
              </div>
            </div>

            {/* Demographics */}
            <div>
              <h3 className="text-xl">Demographics</h3>
              <p>
                Average Age:{" "}
                {summaryMetrics?.demographics?.average_age ?? "N/A"}
              </p>
              <div>
                <p>Gender Distribution:</p>
                <ul>
                  {summaryMetrics?.demographics?.gender_distribution?.map(
                    (item) => (
                      <li key={item.gender}>
                        {item.gender}: {item.count}
                      </li>
                    )
                  )}
                </ul>
              </div>
              <div>
                <p>Age Groups:</p>
                <ul>
                  {summaryMetrics?.demographics?.age_groups?.map((group) => (
                    <li key={group.age_group}>
                      {group.age_group}: {group.count}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Doctor Performance */}
            <div>
              <h3 className="text-xl">Doctor Performance</h3>
              <p>
                Unassigned Patients:{" "}
                {summaryMetrics?.doctors?.unassigned_patients ?? 0}
              </p>
              <div>
                <p>Patients Per Doctor:</p>
                <table className="min-w-full bg-white text-black">
                  <thead>
                    <tr>
                      <th className="px-4 py-2">Doctor Name</th>
                      <th className="px-4 py-2">Patient Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryMetrics?.doctors?.patients_per_doctor?.map((doc) => (
                      <tr key={doc.id}>
                        <td className="border px-4 py-2">{doc.doctor_name}</td>
                        <td className="border px-4 py-2">{doc.patient_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* (Additional analytics sections can be added here as needed.) */}
          </div>
        ) : (
          <p>Loading analytics data...</p>
        )}
      </div>

      {/* Add Doctor Form */}
      <div className="bg-purple-700 p-4 rounded shadow">
        <h2 className="text-2xl font-semibold mb-2">Add Doctor</h2>
        {["firstName", "lastName", "email", "password", "phoneNumber", "specialty"].map((field, i) => (
          <input
            key={i}
            className="w-full p-2 mb-2 text-black rounded"
            type="text"
            placeholder={field}
            value={newDoctor[field]}
            onChange={e => setNewDoctor({ ...newDoctor, [field]: e.target.value })}
          />
        ))}
        <button onClick={handleAddDoctor} className="bg-orange-500 px-4 py-2 rounded">
          Add Doctor
        </button>
      </div>

      {/* Doctor List */}
      <div className="bg-white text-black p-4 rounded shadow">
        <h2 className="text-2xl font-semibold">Doctors</h2>
        {doctors.map(doc => (
          <div key={doc.id} className="flex justify-between items-center border-b py-2">
            <span>
              {doc.first_name} {doc.last_name} - {doc.specialty}
            </span>
            <div>
              <button onClick={() => handleEditDoctor(doc)} className="bg-yellow-500 px-3 py-1 mr-2 rounded">
                Edit
              </button>
              <button onClick={() => handleRemoveDoctor(doc.id)} className="bg-red-500 px-3 py-1 rounded">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Doctor */}
      {editDoctor && (
        <div className="bg-white text-black p-4 rounded shadow">
          <h3 className="text-lg font-semibold">Edit Doctor</h3>
          {["firstName", "lastName", "email"].map(field => (
            <input
              key={field}
              className="w-full p-2 mb-2 rounded"
              type="text"
              value={doctorForm[field]}
              onChange={e => setDoctorForm({ ...doctorForm, [field]: e.target.value })}
            />
          ))}
          <button onClick={handleSaveEdit} className="bg-green-500 text-white px-4 py-2 rounded">
            Save
          </button>
        </div>
      )}

      {/* Health Questions Management */}
      <div className="bg-purple-700 p-4 rounded shadow">
        <h2 className="text-2xl font-semibold mb-2">Health Questions</h2>
        <input
          className="w-full p-2 mb-2 text-black"
          placeholder="Question"
          value={newQuestion.question}
          onChange={e => handleFieldNameAutoGen(e.target.value)}
        />
        <input
          className="w-full p-2 mb-2 text-black"
          placeholder="Category"
          value={newQuestion.category}
          onChange={e => setNewQuestion({ ...newQuestion, category: e.target.value })}
        />
        <input
          className="w-full p-2 mb-2 text-black"
          placeholder="Field Name (auto)"
          value={newQuestion.field_name}
          readOnly
        />
        <input
          className="w-full p-2 mb-2 text-black"
          placeholder="Options (comma separated)"
          value={newQuestion.options}
          onChange={e => setNewQuestion({ ...newQuestion, options: e.target.value })}
        />
        <select
          className="w-full p-2 mb-2 text-black"
          value={newQuestion.parent_question_id}
          onChange={e => setNewQuestion({ ...newQuestion, parent_question_id: e.target.value })}
        >
          <option value="">None (Top-Level Question)</option>
          {questions.map(q => (
            <option key={q.id} value={q.id}>
              {q.question}
            </option>
          ))}
        </select>
        <input
          className="w-full p-2 mb-2 text-black"
          placeholder="Trigger Value"
          value={newQuestion.trigger_value}
          onChange={e => setNewQuestion({ ...newQuestion, trigger_value: e.target.value })}
        />
        <button onClick={editQuestion ? handleSaveEditQuestion : handleAddQuestion} className="bg-orange-500 w-full py-2 mt-2 rounded">
          {editQuestion ? "Update Question" : "Add Question"}
        </button>
      </div>

      {/* List of Questions */}
      <div className="bg-white text-black p-4 rounded shadow">
        {questions.map(q => (
          <div key={q.id} className="flex justify-between items-center border-b py-2">
            <span>
              {q.question} ({q.category})
            </span>
            <div>
              <button onClick={() => handleEditQuestion(q)} className="bg-yellow-500 px-3 py-1 mr-2 rounded">
                Edit
              </button>
              <button onClick={() => handleDeleteQuestion(q.id)} className="bg-red-500 px-3 py-1 rounded">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Audit Logs */}
      <div className="mt-6">
        <button onClick={toggleAuditLogs} className="bg-purple-600 px-4 py-2 rounded">
          {showLogs ? "Hide Logs" : "Show Audit Logs"}
        </button>
        {showLogs && (
          <div className="bg-white text-black mt-4 p-4 rounded shadow h-64 overflow-y-auto">
            {auditLogs.map(log => (
              <div key={log.id} className="border-b py-2">
                <p>
                  <strong>Action:</strong> {log.action} on {log.entity}
                </p>
                <p>
                  <strong>User:</strong> {log.user_name}
                </p>
                <p>
                  <strong>Time:</strong> {new Date(log.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
