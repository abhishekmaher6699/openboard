import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";

import { login, getMe } from "../../../api/auth";
import type { LoginInput } from "../../../types/auth";

import AuthCard from "../utils/authCard";

import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { useAuth } from "../../../context/auth-context";
import { toast } from "sonner";
import ThemeToggle from "../../ui/ThemeToggle";

const LoginPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<LoginInput>({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await login(form);

      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);

      const user = await getMe();
      setUser(user);

      navigate("/dashboard");
      toast.success("Logged in successfully!");
    } catch (err: any) {
      setError(err.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Login">

      <div className="fixed top-3 right-3 z-10001 bg-white dark:bg-neutral-800 border dark:border-neutral-700 rounded-full px-2 py-2 shadow-lg">
        <ThemeToggle />
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Username */}
        <div className="space-y-2">
          <Label
            htmlFor="username"
            className="text-gray-700 dark:text-gray-300"
          >
            Username
          </Label>

          <Input
            id="username"
            placeholder="Enter your username"
            value={form.username}
            onChange={(e) => {
              setError(null);
              setForm({ ...form, username: e.target.value });
            }}
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label
            htmlFor="password"
            className="text-gray-700 dark:text-gray-300"
          >
            Password
          </Label>

          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={(e) => {
              setError(null);
              setForm({ ...form, password: e.target.value });
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-500 dark:text-red-400 text-center">
            {error}
          </p>
        )}

        {/* Submit */}
        <Button className="w-full" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </Button>

        {/* Register */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Register
          </Link>
        </p>
      </form>
    </AuthCard>
  );
};

export default LoginPage;
