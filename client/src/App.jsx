import { useEffect } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";

import Auth from "./pages/Auth";
import UserProfile from "./pages/UserProfile";
import Lobby from "./pages/Lobby";
import StartTournament from "./pages/StartTournament";
import Wallet from "./pages/Wallet";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleLogout = () => {
      navigate("/auth", { replace: true });
    };

    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, [navigate]);

  function handleAuthSuccess(newToken) {
    localStorage.setItem("token", newToken);
    navigate("/lobby", { replace: true });
  }

  function handleManualLogout() {
    localStorage.removeItem("token");
    window.dispatchEvent(new CustomEvent("auth:logout"));
  }

  const token = localStorage.getItem("token");

  return (
    <Routes>
      <Route path="/auth" element={<Auth onAuthSuccess={handleAuthSuccess} />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/profile" element={<UserProfile onLogout={handleManualLogout} />} />
        <Route path="/tournaments/new" element={<StartTournament />} />
        <Route path="/wallet" element={<Wallet />} />
      </Route>

      <Route path="/" element={<Navigate to={token ? "/lobby" : "/auth"} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
