import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { propertyApi } from "../services/api";
import UtilitiesPanel from "../components/UtilitiesPanel";
import RiskAssessmentPanel from "../components/RiskAssessmentPanel";
import ComparablesPanel from "../components/ComparablesPanel";
import ValueHistoryPanel from "../components/ValueHistoryPanel";

const CHECKS = [
  { key: "ownership", title: "Ownership", subtitle: "Current owner records", icon: "01" },
  { key: "tax", title: "Tax history", subtitle: "Assessment and tax records", icon: "02" },
  { key: "zoning", title: "Zoning", subtitle: "Parcel and land-use data", icon: "03" },
  { key: "flood", title: "Flood zone", subtitle: "FEMA flood hazard data", icon: "04" },
  { key: "permits", title: "Permits", subtitle: "Building permit history", icon: "05" },
  { key: "environmental", title: "Environmental", subtitle: "EPA facility records", icon: "06" }
];

// Maps a check key to the field name the aggregate endpoint returns it under.
const AGGREGATE_KEYS = {
  ownership: "ownership",
  tax: "taxHistory",
  zoning: "zoning",
  flood: "floodZone",
  permits: "permits",
  environmental: "environmental"
};

export default function PropertyDetails() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [checks, setChecks] = useState({});
  const [runningAll, setRunningAll] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setHistoryLoading(true);
      setError("");
      setHistoryError("");

      const [propertyResult, historyResult] = await Promise.allSettled([
        propertyApi.details(id),
        propertyApi.history(id)
      ]);

      if (!mounted) return;

      if (propertyResult.status === "fulfilled") {
        setProperty(propertyResult.value);
      } else {
        setError(propertyResult.reason?.message || "Unable to load property details.");
      }

      if (historyResult.status === "fulfilled") {
        setHistory(Array.isArray(historyResult.value) ? historyResult.value : []);
      } else {
        setHistoryError(historyResult.reason?.message || "Unable to load property history.");
      }

      setLoading(false);
      setHistoryLoading(false);
    }

    load();
    return () => { mounted = false; };
  }, [id]);

  async function loadCheck(key) {
    setChecks(current => ({
      ...current,
      [key]: { loading: true, error: "", data: current[key]?.data ?? null }
    }));

    try {
      const data =
        key === "ownership" ? await propertyApi.ownership(id) :
        key === "tax" ? await propertyApi.taxHistory(id) :
        key === "zoning" ? await propertyApi.zoning(id) :
        key === "flood" ? await propertyApi.floodZone(id) :
        key === "permits" ? await propertyApi.permits(id) :
        await propertyApi.environmental(id);

      setChecks(current => ({ ...current, [key]: { loading: false, error: "", data } }));
    } catch (err) {
      setChecks(current => ({
        ...current,
        [key]: { loading: false, error: err.message || "Unable to load this check.", data: null }
      }));
    }
  }

  /**
   * Runs all six external checks in ONE call via the backend's parallel
   * aggregation endpoint, instead of firing six separate requests -
   * exercises the actual CompletableFuture-based /due-diligence endpoint.
   * Each section's SUCCESS/FAILED status maps straight onto the same
   * check-card UI used for single checks.
   */
  async function runAllChecks() {
    setRunningAll(true);
    CHECKS.forEach(check => {
      setChecks(current => ({ ...current, [check.key]: { loading: true, error: "", data: current[check.key]?.data ?? null } }));
    });

    try {
      const aggregate = await propertyApi.dueDiligence(id);
      const nextChecks = {};
      CHECKS.forEach(check => {
        const section = aggregate[AGGREGATE_KEYS[check.key]];
        if (section?.status === "SUCCESS") {
          nextChecks[check.key] = { loading: false, error: "", data: section.data };
        } else {
          nextChecks[check.key] = { loading: false, error: section?.errorMessage || "This section failed.", data: null };
        }
      });
      setChecks(current => ({ ...current, ...nextChecks }));
    } catch (err) {
      const message = err.message || "Unable to run due diligence.";
      const nextChecks = {};
      CHECKS.forEach(check => { nextChecks[check.key] = { loading: false, error: message, data: null }; });
      setChecks(current => ({ ...current, ...nextChecks }));
    } finally {
      setRunningAll(false);
    }
  }

  if (loading) {
    return <main className="details-page"><div className="loading-state"><div className="loading-spinner" />Loading property details...</div></main>;
  }

  if (error || !property) {
    return (
      <main className="details-page">
        <Link className="back-link" to="/properties">← Back to property search</Link>
        <div className="form-error">{error || "Property not found."}</div>
      </main>
    );
  }

  return (
    <main className="details-page">
      <Link className="back-link" to="/properties">← Back to property search</Link>

      <section className="property-summary">
        <div className="summary-main">
          <div className="summary-kicker"><span className="status-dot active" /> PROPERTY #{property.id}</div>
          <h1>{property.address}</h1>
          <p>{property.location || "Location not available"}</p>
          <div className="summary-tags">
            <span>{property.type || "Property"}</span>
            <span>{property.yearBuilt ? `Built ${property.yearBuilt}` : "Year not available"}</span>
          </div>
        </div>
        <div className="summary-action">
          <span className="action-label">Due diligence</span>
          <strong>Six external checks, run in parallel</strong>
          <button className="primary-button compact" onClick={runAllChecks} disabled={runningAll}>
            {runningAll ? "Running..." : "Run all checks"}
          </button>
        </div>
      </section>

      <section className="property-facts-panel">
        <div className="section-heading compact-heading">
          <div><span className="eyebrow">PROPERTY PROFILE</span><h2>Core information</h2></div>
        </div>
        <div className="details-grid clean-grid">
          <Detail label="Property type" value={property.type} />
          <Detail label="Bedrooms" value={property.bedrooms} />
          <Detail label="Bathrooms" value={property.bathrooms} />
          <Detail label="Square feet" value={property.squareFeet ? `${property.squareFeet} ft²` : null} />
          <Detail label="Latitude" value={property.latitude} />
          <Detail label="Longitude" value={property.longitude} />
        </div>
      </section>

      <section className="diligence-section">
        <div className="section-heading">
          <div><span className="eyebrow">DUE DILIGENCE</span><h2>Property checks</h2><p>External records are fetched through the backend and saved to the property database.</p></div>
          <span className="history-count">ATTOM + REGRID + FEMA + SHOVELS + EPA</span>
        </div>
        <div className="check-grid">
          {CHECKS.map(check => <DueDiligenceCard key={check.key} check={check} state={checks[check.key]} onLoad={() => loadCheck(check.key)} />)}
        </div>
      </section>

      <ValueHistoryPanel propertyId={id} />

      <UtilitiesPanel propertyId={id} />

      <RiskAssessmentPanel propertyId={id} />

      <ComparablesPanel propertyId={id} />

      <section className="history-section">
        <div className="section-heading">
          <div><span className="eyebrow">PROPERTY HISTORY</span><h2>Recorded activity</h2></div>
          <span className="history-count">{historyLoading ? "Loading..." : `${history.length} records`}</span>
        </div>

        {historyError ? <div className="form-error">{historyError}</div> : historyLoading ? (
          <div className="history-card loading-history">Loading property history...</div>
        ) : history.length === 0 ? (
          <div className="history-card empty-history"><div className="history-icon">◷</div><div><h3>No history available</h3><p>No property history records are currently available for this property.</p></div></div>
        ) : (
          <div className="history-card">
            <div className="timeline">
              {history.map((item, index) => (
                <article className="timeline-item" key={`${item.date}-${index}`}>
                  <div className="timeline-marker" />
                  <div className="timeline-content">
                    <div className="timeline-top"><strong>{item.label || "Timeline event"}</strong><span>{formatDate(item.date)}</span></div>
                    <p>{item.description || "No description available."}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function DueDiligenceCard({ check, state, onLoad }) {
  const data = state?.data;
  const hasData = Boolean(data);
  const error = state?.error;

  return (
    <article className={`check-card ${hasData ? "loaded" : ""}`}>
      <div className="check-top"><span className="check-number">{check.icon}</span><span className={hasData ? "check-status ready" : "check-status"}>{hasData ? "Available" : "Not loaded"}</span></div>
      <h3>{check.title}</h3>
      <p>{check.subtitle}</p>
      {state?.loading ? <div className="check-loading"><span className="mini-spinner" /> Fetching external records...</div> : error ? <div className="check-error">{error}</div> : hasData ? <CheckPreview type={check.key} data={data} /> : <button className="secondary-button" onClick={onLoad}>Load {check.title.toLowerCase()}</button>}
    </article>
  );
}

function CheckPreview({ type, data }) {
  if (type === "ownership") {
    const records = Array.isArray(data) ? data : [];
    return <div className="check-preview"><strong>{records.length} owner record{records.length === 1 ? "" : "s"}</strong><span>{records[0]?.ownerName || "Owner name not returned"}</span></div>;
  }
  if (type === "tax") {
    const records = Array.isArray(data) ? data : [];
    const latest = records[0];
    return <div className="check-preview"><strong>{latest?.taxYear || "Tax year unavailable"}</strong><span>{latest?.taxAmount != null ? `Tax: ${latest.taxAmount}` : "Tax amount not returned"}</span></div>;
  }
  if (type === "zoning") {
    return <div className="check-preview"><strong>{data?.zoningClassification || "Zoning classification unavailable"}</strong><span>{data?.landUse || "Land-use data not returned"}</span></div>;
  }
  if (type === "flood") {
    return <div className="check-preview"><strong>{data?.floodZone ? `Zone ${data.floodZone}` : "Flood zone unavailable"}</strong><span>{data?.floodRiskRating ? `${data.floodRiskRating} risk` : "Risk rating not returned"}</span></div>;
  }
  if (type === "permits") {
    const records = Array.isArray(data) ? data : [];
    return <div className="check-preview"><strong>{records.length} permit{records.length === 1 ? "" : "s"} on file</strong><span>{records[0]?.permitType || "No permit type returned"}</span></div>;
  }
  const records = Array.isArray(data) ? data : [];
  return <div className="check-preview"><strong>{records.length} facility record{records.length === 1 ? "" : "s"}</strong><span>{records[0]?.facilityName || "No facility name returned"}</span></div>;
}

function Detail({ label, value }) {
  return <div className="detail-item"><span>{label}</span><strong>{value ?? "Not available"}</strong></div>;
}

function formatDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
