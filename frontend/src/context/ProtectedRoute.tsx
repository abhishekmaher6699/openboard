import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/auth-context";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!user) {
    // save where they were trying to go
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}