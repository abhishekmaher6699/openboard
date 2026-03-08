import { Navigate } from "react-router-dom"
import { useAuth } from "../context/auth-context"

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {

  const { user, loading } = useAuth()

 if (loading) {
    return null
  }
  
  if (!user && !loading) {
    return <Navigate to="/login" replace />
  }

  return children
}