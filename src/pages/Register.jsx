import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

// ✅ Base backend URL from environment
const API_URL = import.meta.env.VITE_API_URL;


export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [step, setStep] = useState("register"); // "register" | "verify"
  const nav = useNavigate();

  // 🔹 Send OTP (register user)
  const handleRegister = async () => {
    if (!username || !email || !password || !confirm)
      return toast.error("Please fill all fields.");
    if (password !== confirm)
      return toast.error("Passwords do not match.");

    try {
      await axios.post(`${API_URL}/api/auth/register`, {
        username,
        password,
        email,
      });
      toast.success("✅ OTP sent to your email. Please verify it.");
      setStep("verify");
      startTimer();
      setOtpSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    }
  };

  // 🔹 Resend OTP (only re-send, not re-register)
  const resendOtp = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/send-otp`, {
        username,
        email,
      });
      toast.success("🔁 New OTP sent to your email.");
      startTimer();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend OTP");
    }
  };

  // 🔹 Start 30s resend timer
  const startTimer = () => {
    setTimer(30);
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) clearInterval(interval);
        return prev - 1;
      });
    }, 1000);
  };

  // 🔹 Verify OTP
  const handleVerify = async () => {
    if (!otp) return toast.success("Enter the OTP sent to your email.");
    try {
      await axios.post(`${API_URL}/api/auth/verify-otp`, {
        username,
        otp,
      });
      toast.success("🎉 Email verified successfully! You can now log in.");
      nav("/", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "OTP verification failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#1e1e2f] to-[#2b2b44] px-4 text-white">
    <Toaster position="top-center" />
      <div className="w-full max-w-md bg-[#141826] rounded-2xl shadow-2xl border border-gray-700 p-8">
        <h1 className="text-3xl font-extrabold text-center text-blue-400 mb-6 tracking-wide">
          {step === "register" ? "Create Account 🚀" : "Verify OTP 🔐"}
        </h1>

        {step === "register" && (
          <>
            <div className="space-y-4">
              <input
                className="w-full p-3 rounded-lg bg-[#252547] border border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <input
                className="w-full p-3 rounded-lg bg-[#252547] border border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                className="w-full p-3 rounded-lg bg-[#252547] border border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <input
                className="w-full p-3 rounded-lg bg-[#252547] border border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
                type="password"
                placeholder="Confirm Password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>

            <button
              onClick={handleRegister}
              className="mt-6 w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 rounded-lg shadow-md transition-all duration-300"
            >
              Register & Send OTP
            </button>

            <p
              className="text-blue-400 text-center mt-5 cursor-pointer hover:underline"
              onClick={() => nav("/")}
            >
              Back to Login
            </p>
          </>
        )}

        {step === "verify" && (
          <>
            <p className="text-gray-400 text-center mb-3">
              Enter the OTP sent to <b className="text-blue-300">{email}</b>
            </p>

            <div className="flex gap-2">
              <input
                className="flex-1 p-3 rounded-lg bg-[#252547] border border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <button
                onClick={resendOtp}
                disabled={timer > 0}
                className={`px-4 rounded-lg font-semibold transition-all ${
                  timer > 0
                    ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {timer > 0 ? `Resend (${timer}s)` : "Resend OTP"}
              </button>
            </div>

            <button
              onClick={handleVerify}
              className="mt-6 w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg shadow-md transition-all duration-300"
            >
              Verify OTP
            </button>

            <p
              className="text-blue-400 text-center mt-5 cursor-pointer hover:underline"
              onClick={() => setStep("register")}
            >
              Back to Register
            </p>
          </>
        )}
      </div>
    </div>
  );
}
