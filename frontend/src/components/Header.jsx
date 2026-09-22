import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  function handleLogout() { logout(); navigate("/login", { replace: true }); }

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" to={isAuthenticated ? "/properties" : "/login"}>
          <span className="brand-mark">RE</span>
          <span><strong>Due Diligence</strong><small>Real Estate Intelligence</small></span>
        </Link>
        <nav className="header-nav">
          {isAuthenticated ? <>
            <Link className={location.pathname === "/properties" ? "active" : ""} to="/properties">Properties</Link>
            <Link className={location.pathname === "/validate-address" ? "active" : ""} to="/validate-address">Address Check</Link>
            <Link className={`profile-button ${location.pathname === "/profile" ? "active-profile" : ""}`} to="/profile" title="My Account">
              <span className="header-avatar">{initials(user?.fullName)}</span>
              <span className="profile-button-text"><strong>{user?.fullName || "User"}</strong><small>My Account</small></span>
            </Link>
            <button className="logout-button" onClick={handleLogout}>Logout</button>
          </> : <Link className={location.pathname === "/login" ? "active" : ""} to="/login">Login</Link>}
        </nav>
      </div>
    </header>
  );
}
function initials(name = "User") { return name.split(" ").filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "U"; }
