import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";

const ReportDisplay = () => {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState("");
    const [report, setReport] = useState("");
    const [loading, setLoading] = useState(false);

    const getToken = () => localStorage.getItem("token");

    // Step 1: Fetch all patients with submitted responses
    useEffect(() => {
        const token = getToken();
        fetch(`${API_BASE_URL}/api/reported-patients`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => setPatients(data))
            .catch((err) => console.error("Error fetching patients:", err));
    }, []);

    // Step 2: Generate report for selected patient
    const generateReport = () => {
        if (!selectedPatientId) return alert("Please select a patient.");
        const token = getToken();
        setLoading(true);
        setReport("");

        fetch(`${API_BASE_URL}/api/reports/patient/${selectedPatientId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setReport(data.report);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error generating report:", err);
                setLoading(false);
                alert("Failed to generate report.");
            });
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900">
            <div className="max-w-2xl w-full bg-purple-700 p-8 rounded-lg shadow-lg text-white">
                <h1 className="text-3xl font-bold text-center mb-6">Patient Health Report</h1>

                <div className="mb-6">
                    <label className="block text-lg mb-2">Select a patient by email:</label>
                    <select
                        className="w-full p-2 rounded bg-purple-100 text-black"
                        value={selectedPatientId}
                        onChange={(e) => setSelectedPatientId(e.target.value)}
                    >
                        <option value="">-- Select --</option>
                        {patients.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.email}
                            </option>
                        ))}
                    </select>

                    <div className="flex flex-wrap gap-4 mt-4">
                        <button
                            onClick={generateReport}
                            className="flex-1 py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition"
                        >
                            Generate Report
                        </button>
                        <button
                            onClick={() => navigate("/admin-dashboard")}
                            className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition"
                        >
                            ← Back to Dashboard
                        </button>
                    </div>
                </div>

                {loading && (
                    <p className="text-lg text-yellow-300 text-center">Generating report...</p>
                )}

                {report && (
                    <div className="bg-purple-800 p-4 rounded shadow text-white whitespace-pre-wrap">
                        <h3 className="text-2xl mb-2 font-semibold">AI-Generated Report:</h3>
                        <p>{report}</p>
                    </div>
                )}
            </div>
        </div>
    );

};

export default ReportDisplay;
