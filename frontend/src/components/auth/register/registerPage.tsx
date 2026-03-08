import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";

import { register, getMe } from "../../../api/auth-funcs";
import type { RegisterInput } from "../../../types/auth";

import AuthCard from "../utils/authCard";

import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { useAuth } from "../../../context/auth-context";
import { toast } from "sonner";

const RegisterPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<RegisterInput>({
    username: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await register(form);

      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);

      const user = await getMe();
      setUser(user);
      
      navigate("/dashboard");
      toast.success("Account created successfully!");
    } catch (err: any) {
       setError(err.detail || "Something went wrong")
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Create an Account">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            placeholder="Choose a username"
            value={form.username}
            onChange={(e) => {
              setError(null);
              setForm({ ...form, username: e.target.value });
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={(e) => {
              setError(null);
              setForm({ ...form, email: e.target.value });
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Create a password"
            value={form.password}
            onChange={(e) => {
              setError(null);
              setForm({ ...form, password: e.target.value });
            }}
          />
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <Button className="w-full" disabled={loading}>
          {loading ? "Creating account..." : "Register"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Login
          </Link>
        </p>
      </form>
    </AuthCard>
  );
};

export default RegisterPage;
