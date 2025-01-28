import React from "react";
import { useNavigate } from "react-router-dom";

const Homepage = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 text-white">
            <div className="max-w-3xl text-center">
                <h1 className="text-5xl font-extrabold mb-6">Welcome to Patient Data Collection</h1>
                <p className="text-lg text-gray-300 mb-8">
                    A secure and efficient way to manage patient information.
                </p>
                
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate("/register")}
                        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-lg shadow-md"
                    >
                        Register Patient
                    </button>

                    <button
                        onClick={() => navigate("/groupregister")}
                        className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg text-lg shadow-md"
                    >
                        Register Family Group
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Homepage;
