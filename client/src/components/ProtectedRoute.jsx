// src/components/ProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom";

// Protects routes that require authentication
export default function ProtectedRoute() {
  const token = localStorage.getItem("token");

  // If no token, redirect to auth page
  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
}
