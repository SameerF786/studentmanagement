import React, { useState } from "react";
import "./login.css";

const API_URL = "http://localhost:5000/api/auth/login";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Remember me checked: persist through browser restarts.
      // Otherwise keep the session for this tab only.
      const storage = remember ? localStorage : sessionStorage;

      localStorage.removeItem("smsToken");
      sessionStorage.removeItem("smsToken");
      storage.setItem("smsToken", data.token);
      storage.setItem("smsUser", JSON.stringify(data.user));

      onLogin(data.user);
    } catch (err) {
      setError(
        err.message === "Failed TO Fetch"
          ? "backend is not connected please check port 5000."
          : err.message,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-visual">
          <div className="visual-glow glow-one"></div>
          <div className="visual-glow glow-two"></div>

          <div className="brand-mark">✦</div>

          <div className="visual-content">
            <p className="eyebrow">YOUR CAMPUS. YOUR FUTURE.</p>
            <h1>
              SMART
              <br />
              <span>STUDENT</span>
              <br />
              MANAGEMENT
            </h1>

            <div className="visual-line"></div>

            <p className="visual-description">
              One intelligent space to manage students, academic records and
              your campus journey.
            </p>
          </div>

          <div className="visual-footer">
            <span className="status-dot"></span>
            YOUR ACADAMIC JOURNEY START HERE,,,
          </div>
        </div>

        <div className="login-form-panel">
          <div className="mobile-brand">✦ SMART SMS</div>

          <div className="login-heading">
            <div className="login-icon">✦</div>
            <p className="welcome-label">STUDENT MANAGEMENT SYSTEM</p>
            <h2>Welcome Back</h2>
            <p className="subtitle">
              Sign in to access your student Dashboard.
            </p>
          </div>

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <label htmlFor="login-email">Email Address</label>
            <div className="login-input-wrap">
              <span className="input-symbol">@</span>
              <input
                id="login-email"
                type="email"
                placeholder="admin@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <label htmlFor="login-password">Password</label>
            <div className="login-input-wrap">
              <span className="input-symbol">♙</span>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter Your Password->"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button className="login-submit" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
              {!loading && <span>→</span>}
            </button>
          </form>

          <div className="login-divider">
            <span>SECURE STUDENT PORTAL</span>
          </div>

          <div className="security-note">
            <span className="security-icon">✓</span>
            <p>
              Your academic workspace,
              <br />
              all in one place.
            </p>
          </div>

          <p className="login-bottom">
            STUDENT MANAGEMENT SYSTEM <span>•</span> SECURE ACCESS
          </p>
        </div>
      </section>
    </main>
  );
}

export default Login;
