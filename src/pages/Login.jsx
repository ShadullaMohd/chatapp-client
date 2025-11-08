import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast"; // ✅ added

// ✅ Base backend URL from environment
const API_URL = import.meta.env.VITE_API_URL;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPass] = useState("");
  const nav = useNavigate();

  // ✅ LOGIN FUNCTION
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your Gmail and password"); 
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, {
        email, // ✅ use email now
        password,
      });

      // ✅ Save user info to localStorage
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("username", res.data.user.username);
      localStorage.setItem("email", res.data.user.email);
      localStorage.setItem("userId", res.data.user.id);

      toast.success("✅ Login successful! Redirecting...");
      setTimeout(() => nav("/chat", { replace: true }), 800); // small delay for UX
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#1e1e2f] to-[#2b2b44] px-4 text-white">
      {/* ✅ Toast Container */}
      <Toaster position="top-center" reverseOrder={false} />

      <div className="w-full max-w-md bg-[#141826] rounded-2xl shadow-2xl border border-gray-700 p-8">
        <h1 className="text-3xl font-extrabold text-center text-blue-400 mb-6 tracking-wide">
          Welcome Back 👋
        </h1>

        <form onSubmit={handleLogin} className="flex flex-col space-y-4">
          {/* 📨 Email Input */}
          <input
            type="email"
            className="w-full p-3 rounded-lg bg-[#252547] border border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Enter your Gmail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* 🔒 Password Input */}
          <input
            type="password"
            className="w-full p-3 rounded-lg bg-[#252547] border border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Password"
            value={password}
            onChange={(e) => setPass(e.target.value)}
          />

          {/* 🚀 Login Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg shadow-md transition-all duration-300"
          >
            Login
          </button>
        </form>

        {/* 🔗 Register Redirect */}
        <p className="text-sm text-gray-400 text-center mt-5">
          Don’t have an account?{" "}
          <span
            onClick={() => nav("/register")}
            className="text-blue-400 hover:underline cursor-pointer"
          >
            Create one
          </span>
        </p>
      </div>
    </div>
  );
}
