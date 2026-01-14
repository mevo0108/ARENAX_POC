import { useState } from "react";
import Auth from "./pages/Auth";
import UserProfile from "./pages/UserProfile";

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  function handleAuthSuccess(newToken) {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setToken(null);
  }

  return token ? (
    <UserProfile onLogout={handleLogout} />
  ) : (
    <Auth onAuthSuccess={handleAuthSuccess} />
  );
}
