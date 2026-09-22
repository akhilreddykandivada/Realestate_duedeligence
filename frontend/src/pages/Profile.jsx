import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { userApi, reportApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({ fullName: "", email: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reports, setReports] = useState([]);
  const [reportsError, setReportsError] = useState("");
  const [reportsLoading, setReportsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState("");

  async function loadProfile() {
    setLoading(true);
    setError("");
    try {
      const data = await userApi.getProfile();
      setProfile(data);
      setProfileForm({ fullName: data.fullName || "", email: data.email || "" });
      updateUser(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadProfile(); }, []);

  useEffect(() => {
    if (!profile?.id) return;
    let mounted = true;
    setReportsLoading(true);
    reportApi.getUserReports(profile.id)
      .then(data => { if (mounted) setReports(Array.isArray(data) ? data : []); })
      .catch(err => { if (mounted) setReportsError(err.message || "Unable to load report history."); })
      .finally(() => { if (mounted) setReportsLoading(false); });
    return () => { mounted = false; };
  }, [profile?.id]);

  async function handleDownload(reportId, type) {
    setDownloadingId(`${reportId}-${type}`);
    try {
      if (type === "pdf") await reportApi.downloadPdf(reportId);
      else await reportApi.downloadExcel(reportId);
    } catch (err) {
      setReportsError(err.message || `Unable to download the ${type.toUpperCase()} file.`);
    } finally {
      setDownloadingId("");
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSavingProfile(true);
    try {
      const data = await userApi.updateProfile(profileForm);
      setProfile(data);
      setProfileForm({ fullName: data.fullName, email: data.email });
      updateUser(data);
      setSuccess("Profile details updated successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setChangingPassword(true);
    try {
      await userApi.changePassword(passwordForm);
      setPasswordForm({ currentPassword: "", newPassword: "" });
      setSuccess("Password changed successfully. Your current session remains active.");
    } catch (err) {
      setError(err.message);
    } finally {
      setChangingPassword(false);
    }
  }

  if (loading) {
    return <main className="profile-page"><div className="loading-state"><div className="loading-spinner" />Loading your account...</div></main>;
  }

  const properties = profile?.ownedProperties || [];

  return (
    <main className="profile-page">
      <section className="profile-hero">
        <div>
          <span className="eyebrow">MY ACCOUNT</span>
          <h1>Your account, your properties.</h1>
          <p>Manage your profile and security details, then review the properties linked to your account.</p>
        </div>
        <div className="profile-identity">
          <div className="avatar">{initials(profile?.fullName || user?.fullName)}</div>
          <div><strong>{profile?.fullName}</strong><span>{formatRole(profile?.role)}</span></div>
        </div>
      </section>

      {error && <div className="form-error profile-alert">{error}</div>}
      {success && <div className="form-success profile-alert">{success}</div>}

      <section className="profile-grid">
        <div className="profile-card">
          <div className="card-heading"><span>Personal details</span><small>Account information</small></div>
          <form className="form" onSubmit={saveProfile}>
            <label>Username / full name<input value={profileForm.fullName} onChange={e => setProfileForm({ ...profileForm, fullName: e.target.value })} /></label>
            <label>Email address<input type="email" value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} /></label>
            <div className="read-only-row"><span>Role</span><strong>{formatRole(profile?.role)}</strong></div>
            <div className="read-only-row"><span>Member since</span><strong>{formatDate(profile?.createdAt)}</strong></div>
            <button className="primary-button" disabled={savingProfile}>{savingProfile ? "Saving..." : "Save profile changes"}</button>
          </form>
        </div>

        <div className="profile-card">
          <div className="card-heading"><span>Security</span><small>Password protection</small></div>
          <form className="form" onSubmit={changePassword}>
            <label>Current password<input type="password" autoComplete="current-password" value={passwordForm.currentPassword} onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} /></label>
            <label>New password<input type="password" autoComplete="new-password" minLength="8" value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} /></label>
            <p className="security-note">Your password is stored as a BCrypt hash. It is never displayed in this console.</p>
            <button className="secondary-button" disabled={changingPassword}>{changingPassword ? "Updating..." : "Change password"}</button>
          </form>
        </div>
      </section>

      <section className="owned-properties-section">
        <div className="section-heading">
          <div><span className="eyebrow">OWNERSHIP</span><h2>My properties</h2></div>
          <span className="history-count">{properties.length} {properties.length === 1 ? "property" : "properties"}</span>
        </div>
        {properties.length === 0 ? (
          <div className="owned-empty"><div className="empty-symbol">⌂</div><div><h3>No properties linked yet</h3><p>Properties assigned to your account by an administrator will appear here.</p></div></div>
        ) : (
          <div className="owned-grid">{properties.map(property => <Link to={`/properties/${property.id}`} className="owned-property" key={property.id}><div className="owned-property-top"><span className="property-type">{property.type || "Property"}</span><span>#{property.id}</span></div><h3>{property.address}</h3><p>{property.location || "Location unavailable"}</p><span className="view-property">View property →</span></Link>)}</div>
        )}
      </section>

      <section className="my-reports-section">
        <div className="section-heading">
          <div><span className="eyebrow">REPORTS</span><h2>My reports</h2></div>
          <span className="history-count">{reportsLoading ? "Loading..." : `${reports.length} report${reports.length === 1 ? "" : "s"}`}</span>
        </div>

        {reportsError && <div className="form-error">{reportsError}</div>}

        {reportsLoading ? (
          <div className="history-card loading-history">Loading your report history...</div>
        ) : reports.length === 0 ? (
          <div className="owned-empty"><div className="empty-symbol">📄</div><div><h3>No reports yet</h3><p>Generate a due-diligence report from any property's details page to see it here.</p></div></div>
        ) : (
          <div className="report-list">
            {reports.map(report => (
              <article className="report-row" key={report.id}>
                <div className="report-row-main">
                  <Link to={`/properties/${report.propertyId}`}>Property #{report.propertyId}</Link>
                  <span className={`report-status status-${(report.status || "").toLowerCase()}`}>{report.status}</span>
                </div>
                <div className="report-row-meta">
                  <span>{formatDate(report.createdAt)}</span>
                  {report.riskScore != null && <span>Risk score: {report.riskScore.toFixed(1)}</span>}
                </div>
                {report.status === "COMPLETED" && (
                  <div className="report-row-actions">
                    <button className="text-button" disabled={!report.pdfUrl || downloadingId === `${report.id}-pdf`}
                            onClick={() => handleDownload(report.id, "pdf")}>
                      {downloadingId === `${report.id}-pdf` ? "Downloading..." : "PDF"}
                    </button>
                    <button className="text-button" disabled={!report.excelUrl || downloadingId === `${report.id}-excel`}
                            onClick={() => handleDownload(report.id, "excel")}>
                      {downloadingId === `${report.id}-excel` ? "Downloading..." : "Excel"}
                    </button>
                  </div>
                )}
                {report.status === "FAILED" && report.failureReason && (
                  <p className="report-failure-reason">{report.failureReason}</p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function initials(name = "User") { return name.split(" ").filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "U"; }
function formatRole(role) { if (!role) return "User"; return role.toLowerCase().split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "); }
function formatDate(value) { if (!value) return "Not available"; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); }
