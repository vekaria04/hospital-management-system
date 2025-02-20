import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.token); // ✅ Store token
        localStorage.setItem("role", data.role); // ✅ Store role

        console.log("🔑 Token:", data.token);
        console.log("👤 User Role:", data.role);

        alert("Login successful!");
        navigate("/"); // Redirect to home
      } else {
        alert("Login failed: " + data.error);
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleVolunteerLogin = async () => {
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "volunteer@v.com",
          password: "volunteer",
        }),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);

        console.log("🔑 Token:", data.token);
        console.log("👤 User Role:", data.role);

        alert("Login successful as Volunteer!");
        navigate("/");
      } else {
        alert("Login failed: " + data.error);
      }
    } catch (error) {
      console.error("Volunteer login error:", error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900">
      <div className="max-w-lg w-full bg-purple-700 p-8 rounded-lg shadow-lg text-white">
        <h1 className="text-3xl font-bold text-center mb-6">Login</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 bg-purple-100 text-black"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 bg-purple-100 text-black"
          />
          <button
            type="submit"
            className="w-full py-3 px-6 bg-orange-500 text-white rounded-md"
          >
            Login
          </button>
        </form>
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleVolunteerLogin}
            className="text-sm text-blue-300 underline"
          >
            Login as Volunteer
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
