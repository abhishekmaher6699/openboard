import { createContext, useContext, useEffect, useState } from "react"
import { getMe, logout as LogoutApi } from "../api/auth"
import type { User } from "../types/auth"

type AuthContextType = {
  user: User | null
  logout: () => void
  setUser: React.Dispatch<React.SetStateAction<User | null>>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    const loadUser = async () => {
      try {
        const data = await getMe()
        setUser(data)
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    loadUser()

  }, [])

  const logout = async () => {
    try {
      const refresh = localStorage.getItem("refresh")

      if (refresh) {
        await LogoutApi(refresh)
      }
    } catch (err) {
      console.error("Logout failed", err)
    }

    localStorage.removeItem("access")
    localStorage.removeItem("refresh")

    setUser(null)
  }

  return (
    <AuthContext.Provider value={{  user, loading, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {

  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider")
  }

  return context
}