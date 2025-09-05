import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/api";
import { isTokenValid } from "../utils/auth"; // Import token validator

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // Redirect logged-in users with valid sessions away from login page
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token && isTokenValid()) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const data = await login(username, password);
      console.log("Login response:", data);

      localStorage.setItem("access_token", data.access_token);

      // Store expiry timestamp (30 mins from now)
      const expiryTime = Date.now() + 30 * 60 * 1000;
      localStorage.setItem("token_expiry", expiryTime.toString());

      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error(err);
      setError("Invalid username or password");
    }
  };

  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
      <h2 className="mb-4">Login</h2>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded shadow"
        style={{ width: "300px", position: "relative" }}
      >
        <div className="mb-3">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="form-control"
            required
          />
        </div>
        <div className="mb-3 position-relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-control"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="btn btn-outline-secondary position-absolute top-50 end-0 translate-middle-y me-2"
            style={{ zIndex: 2 }}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        {error && <p className="text-danger small mb-3">{error}</p>}
        <button type="submit" className="btn btn-primary w-100">
          Login
        </button>
      </form>
    </div>
  );
}