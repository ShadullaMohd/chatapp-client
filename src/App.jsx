import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ChatRoom from "./pages/ChatRoom";
import ProtectedRoute from "./ProtectedRoute";

export default function App() {
  return (
    <Routes>
      {/* Login Page */}
      <Route path="/" element={<Login />} />

      {/* Register Page */}
      <Route path="/register" element={<Register />} />

      {/* Protected Chat Page */}
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatRoom />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
