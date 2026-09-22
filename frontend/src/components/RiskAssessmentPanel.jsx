import { useState } from "react";
import { reportApi } from "../services/api";

const CATEGORY_LABELS = {
  TAX_DUE: "Tax due",
  FLOOD_RISK: "Flood risk",
  ZONING_COMPLIANCE: "Zoning compliance",
  PERMIT_COMPLIANCE: "Permit compliance",
  OWNERSHIP_VERIFICATION: "Ownership verification",
  LEGAL_RISK: "Legal risk"
};

function riskTier(score) {
  if (score == null) return { label: "Unknown", className: "risk-unknown" };
  if (score >= 70) return { label: "High risk", className: "risk-high" };
  if (score >= 40) return { label: "Moderate risk", className: "risk-moderate" };
  return { label: "Low risk", className: "risk-low" };
}

export default function RiskAssessmentPanel({ propertyId }) {
  const [result, setResult] = useState(null);
  const [mode, setMode] = useState(null); // "quick" | "full"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState("");

  // The two endpoints return slightly different shapes - normalize once here.
  const reportId = result?.id ?? result?.reportId;
  const overallScore = result?.riskScore ?? result?.overallRiskScore;
  const categories = result?.riskCategories ?? result?.categories ?? [];
  const overallTier = result ? riskTier(overallScore) : null;
  const failed = result?.status === "FAILED";

  async function runQuickCheck() {
    setLoading(true);
    setError("");
    try {
      const data = await reportApi.runRiskAssessment(propertyId);
      setResult(data);
      setMode("quick");
    } catch (err) {
      setError(err.message || "Unable to run the risk assessment.");
    } finally {
      setLoading(false);
    }
  }

  async function runFullReport() {
    setLoading(true);
    setError("");
    try {
      const data = await reportApi.createReport(propertyId);
      setResult(data);
      setMode("full");
      if (data.status === "FAILED") {
        setError(data.failureReason || "Report generation failed partway through.");
      }
    } catch (err) {
      setError(err.message || "Unable to generate the full report.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(type) {
    setDownloading(type);
    try {
      if (type === "pdf") await reportApi.downloadPdf(reportId);
      else await reportApi.downloadExcel(reportId);
    } catch (err) {
      setError(err.message || `Unable to download the ${type.toUpperCase()} file.`);
    } finally {
      setDownloading("");
    }
  }

  return (
    <section className="risk-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">RISK ASSESSMENT & REPORTS</span>
          <h2>Automated risk report</h2>
          <p>The full report runs risk assessment, pulls comparable listings, builds a timeline, and generates PDF/Excel exports. The quick check only runs the six risk categories.</p>
        </div>
        <div className="risk-actions">
          <button className="secondary-button compact" onClick={runQuickCheck} disabled={loading}>
            {loading && mode === "quick" ? "Checking..." : "Quick risk check"}
          </button>
          <button className="primary-button compact" onClick={runFullReport} disabled={loading}>
            {loading && mode === "full" ? "Generating report..." : "Generate full report"}
          </button>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      {loading && !result && (
        <div className="history-card loading-history">
          {mode === "full" ? "Gathering due diligence, comparables, and building the report..." : "Running all six risk strategies..."}
        </div>
      )}

      {!loading && !result && !error && (
        <div className="history-card empty-history">
          <div className="history-icon">⚖</div>
          <div><h3>No report yet</h3><p>Run a quick check or generate the full report for this property.</p></div>
        </div>
      )}

      {result && !failed && (
        <div className="risk-result">
          <div className={`risk-overall ${overallTier.className}`}>
            <div className="risk-overall-score">{overallScore?.toFixed(1) ?? "—"}</div>
            <div className="risk-overall-meta">
              <span className="risk-overall-tier">{overallTier.label}</span>
              <span className="risk-overall-caption">Overall weighted risk score / 100</span>
            </div>
          </div>

          {result.executiveSummary && (
            <p className="risk-summary">{result.executiveSummary}</p>
          )}

          <div className="risk-category-grid">
            {categories.map((category, index) => {
              const tier = riskTier(category.score);
              return (
                <article className={`risk-category-card ${tier.className}`} key={index}>
                  <div className="risk-category-top">
                    <strong>{CATEGORY_LABELS[category.category] || category.category}</strong>
                    <span className="risk-category-score">{category.score?.toFixed(0)}</span>
                  </div>
                  <div className="risk-bar-track">
                    <div className="risk-bar-fill" style={{ width: `${Math.min(100, category.score || 0)}%` }} />
                  </div>
                  <p className="risk-indicator">{category.indicator}</p>
                  {category.notes && <p className="risk-notes">{category.notes}</p>}
                </article>
              );
            })}
          </div>

          {mode === "full" && (
            <>
              {result.comparables && result.comparables.length > 0 && (
                <div className="comparables-preview">
                  <h3>Comparable listings ({result.comparables.length})</h3>
                  <div className="comparables-mini-list">
                    {result.comparables.slice(0, 5).map((comp, i) => (
                      <div className="comparable-mini-row" key={i}>
                        <span>{comp.comparableAddress || "Address unavailable"}</span>
                        <span>{comp.price != null ? `$${comp.price.toLocaleString()}` : "—"}</span>
                        <span>{comp.distanceMiles != null ? `${comp.distanceMiles.toFixed(1)} mi` : "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="report-downloads">
                <button className="secondary-button compact" onClick={() => handleDownload("pdf")}
                        disabled={!result.pdfUrl || downloading === "pdf"}>
                  {downloading === "pdf" ? "Downloading..." : result.pdfUrl ? "Download PDF" : "PDF not available"}
                </button>
                <button className="secondary-button compact" onClick={() => handleDownload("excel")}
                        disabled={!result.excelUrl || downloading === "excel"}>
                  {downloading === "excel" ? "Downloading..." : result.excelUrl ? "Download Excel" : "Excel not available"}
                </button>
              </div>
            </>
          )}

          <p className="risk-report-id">Report #{reportId}</p>
        </div>
      )}

      {result && failed && (
        <div className="form-error">
          Report #{reportId} failed to generate: {result.failureReason || "Unknown error."}
        </div>
      )}
    </section>
  );
}
