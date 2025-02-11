import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const VerifyEmail = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [message, setMessage] = useState("Click below to verify your email.");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleVerification = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/verify/${token}`);
            const data = await response.json();

            if (response.ok && data.userId) {
                setMessage("Email verified successfully!");
                console.log(`Redirecting to /health-questionnaire/${data.userId}`);
                setTimeout(() => navigate(`/health-questionnaire/${data.userId}`), 3000);
            } else {
                setError(data.error || "Verification failed. Please try again.");
            }
        } catch (err) {
            console.error("Verification error:", err);
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900">
            <div className="max-w-lg w-full bg-gradient-to-br from-purple-700 to-indigo-700 p-8 rounded-lg shadow-lg text-white text-center">
                <h1 className="text-3xl font-bold mb-4">Email Verification</h1>
                {error ? (
                    <p className="text-lg text-red-400">{error}</p>
                ) : (
                    <p className="text-lg">{message}</p>
                )}
                <button
                    onClick={handleVerification}
                    disabled={loading}
                    className="mt-6 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-md shadow-md"
                >
                    {loading ? "Verifying..." : "Verify Email"}
                </button>
            </div>
        </div>
    );
};

export default VerifyEmail;
