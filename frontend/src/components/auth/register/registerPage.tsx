import { useNavigate, Link, useLocation, Navigate } from "react-router-dom"
import { useState } from "react"
import { register, getMe } from "../../../api/auth"
import type { RegisterInput } from "../../../types/auth"
import AuthCard from "../utils/authCard"
import { useAuth } from "../../../context/auth-context"
import { toast } from "sonner"
import ThemeToggle from "../../ui/ThemeToggle"

const LABEL = "text-[0.68rem] font-bold tracking-[0.14em] uppercase text-[#0a0a0a] dark:text-[#f5f0e8]"
const INPUT = "w-full border-2 border-[#0a0a0a] bg-white dark:bg-[#2a2a2a] dark:border-[#c8c0b0] text-[#0a0a0a] dark:text-[#f5f0e8] px-3.5 py-2.5 text-[0.93rem] rounded-none outline-none placeholder:text-[#999] focus:border-[#1a3a6b] focus:shadow-[4px_4px_0px_#1a3a6b] dark:focus:border-[#f7b731] dark:focus:shadow-[4px_4px_0px_#f7b731] transition-shadow"

const RegisterPage = () => {
  const { user, loading: authLoading, setUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as any)?.from?.pathname ?? "/dashboard"
  const [form, setForm] = useState<RegisterInput>({ username: "", email: "", password: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (authLoading) return null
  if (user) return <Navigate to="/dashboard" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await register(form)
      localStorage.setItem("access", data.access)
      localStorage.setItem("refresh", data.refresh)
      const user = await getMe()
      setUser(user)
      navigate("/dashboard")
      toast.success("Account created successfully!")
    } catch (err: any) {
      setError(err?.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard title="Register">
      <div className="fixed top-3 right-3 z-10001 bg-[#f5f0e8] dark:bg-[#1e1e1e] border-2 border-[#0a0a0a] dark:border-[#f5f0e8] p-2 shadow-[3px_3px_0px_#0a0a0a] dark:shadow-[3px_3px_0px_#f7b731]">
        <ThemeToggle />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <label htmlFor="username" className={LABEL} style={{ fontFamily: "'Barlow Condensed','Arial Narrow',sans-serif" }}>Username</label>
          <input id="username" className={INPUT} placeholder="Choose a username" value={form.username}
            onChange={(e) => { setError(null); setForm({ ...form, username: e.target.value }) }} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className={LABEL} style={{ fontFamily: "'Barlow Condensed','Arial Narrow',sans-serif" }}>Email</label>
          <input id="email" type="email" className={INPUT} placeholder="Enter your email" value={form.email}
            onChange={(e) => { setError(null); setForm({ ...form, email: e.target.value }) }} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className={LABEL} style={{ fontFamily: "'Barlow Condensed','Arial Narrow',sans-serif" }}>Password</label>
          <input id="password" type="password" className={INPUT} placeholder="Create a password" value={form.password}
            onChange={(e) => { setError(null); setForm({ ...form, password: e.target.value }) }} />
        </div>

        {error && <p className="text-[0.78rem] font-bold tracking-widest uppercase text-[#d62828] text-center">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full py-3 bg-[#0a0a0a] text-[#f5f0e8] border-2 border-[#0a0a0a] font-black tracking-[0.12em] uppercase text-[0.93rem] shadow-[4px_4px_0px_#d62828] hover:bg-[#d62828] hover:border-[#d62828] hover:shadow-[4px_4px_0px_#0a0a0a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_#0a0a0a] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-75 rounded-none dark:bg-[#f5f0e8] dark:text-[#0a0a0a] dark:border-[#f5f0e8] dark:shadow-[4px_4px_0px_#f7b731] dark:hover:bg-[#f7b731] dark:hover:border-[#f7b731]"
          style={{ fontFamily: "'Barlow Condensed','Arial Narrow',sans-serif" }}>
          {loading ? "Creating account..." : "Register"}
        </button>

        <div className="flex items-center gap-2">
          <div className="flex-1 h-0.5 bg-[#0a0a0a] dark:bg-[#f5f0e8]" />
          <div className="w-2 h-2 bg-[#d62828] rotate-45" />
          <div className="flex-1 h-0.5 bg-[#0a0a0a] dark:bg-[#f5f0e8]" />
        </div>

        <p className="text-center text-[0.8rem] text-[#555] dark:text-[#c8c0b0] tracking-wide">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-[#1a3a6b] dark:text-[#f7b731] border-b-2 border-[#1a3a6b] dark:border-[#f7b731] hover:text-[#d62828] hover:border-[#d62828] transition-colors">
            Login
          </Link>
        </p>
      </form>
    </AuthCard>
  )
}

export default RegisterPage