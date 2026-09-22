import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../services/api";

const ROLES = [
  {
    value: "BUYER",
    label: "Buyer",
    description: "Search and review property information."
  },
  {
    value: "REAL_ESTATE_AGENT",
    label: "Real Estate Agent",
    description: "Work with property information for clients."
  },
  {
    value: "LEGAL_REVIEWER",
    label: "Legal Reviewer",
    description: "Review property information for legal due diligence."
  },
  {
    value: "FINANCIAL_INSTITUTION",
    label: "Financial Institution",
    description: "Review property information for financial assessment."
  }
];

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: ""
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!form.role) {
      setError("Please select a role.");
      return;
    }

    setLoading(true);

    try {
      await authApi.register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role
      });

      setSuccess("Registration successful. You can now login.");
      setTimeout(() => navigate("/login"), 900);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-page">
      <section className="register-card">
        <div className="register-heading">
          <span className="eyebrow">CREATE ACCOUNT</span>
          <h1>Register for Due Diligence</h1>
          <p>
            Choose the role that describes how you will use the application.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <div className="two-column">
            <label>
              Full name
              <input
                type="text"
                autoComplete="name"
                placeholder="Your full name"
                value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })}
              />
            </label>

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
          </div>

          <label>
            Password
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Minimum 8 characters"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
          </label>

          <fieldset className="role-fieldset">
            <legend>Select your role</legend>
            <div className="role-grid">
              {ROLES.map(role => (
                <label
                  className={`role-option ${
                    form.role === role.value ? "selected" : ""
                  }`}
                  key={role.value}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={form.role === role.value}
                    onChange={e => setForm({ ...form, role: e.target.value })}
                  />
                  <span>
                    <strong>{role.label}</strong>
                    <small>{role.description}</small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <p className="admin-note">
            Administrator registration is intentionally not available here.
            The backend creates the administrator account separately.
          </p>

          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}

          <button className="primary-button" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </section>
    </div>
  );
}