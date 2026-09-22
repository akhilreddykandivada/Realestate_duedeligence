import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { authApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/properties" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.login({
        email: form.email.trim(),
        password: form.password
      });

      login(response);
      navigate("/properties", { replace: true });
    } catch (err) {
      setError(
        err.status === 401 || err.status === 403
          ? "Invalid email or password."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-panel">
        <div className="auth-intro">
          <span className="eyebrow">REAL ESTATE DUE DILIGENCE</span>
          <h1>Search properties with the right information.</h1>
          <p>
            Sign in to search the property database and view complete
            property details.
          </p>
        </div>

        <div className="auth-card">
          <div className="auth-card-heading">
            <h2>Welcome back</h2>
            <p>Login to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="form">
            <label>
              Email
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </label>

            <label>
              Password
              <input
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
            </label>

            {error && <div className="form-error">{error}</div>}

            <button className="primary-button" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </div>
      </section>
    </div>
  );
}