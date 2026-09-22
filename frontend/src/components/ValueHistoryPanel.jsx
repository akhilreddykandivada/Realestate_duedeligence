import { useEffect, useState } from "react";
import { propertyApi } from "../services/api";

export default function ValueHistoryPanel({ propertyId }) {
  const [history, setHistory] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    propertyApi.valueHistory(propertyId)
      .then(data => { if (mounted) setHistory(Array.isArray(data) ? data : []); })
      .catch(err => { if (mounted) setError(err.message || "Unable to load value history."); });
    return () => { mounted = false; };
  }, [propertyId]);

  if (error) return null; // non-critical - fail silently rather than clutter the page
  if (!history || history.length === 0) return null;

  const maxValue = Math.max(...history.map(h => h.assessedValue || 0), 1);

  return (
    <section className="value-history-section">
      <div className="section-heading compact-heading">
        <div><span className="eyebrow">ASSESSED VALUE</span><h2>Value history by year</h2></div>
      </div>
      <div className="value-history-chart">
        {history.map(entry => (
          <div className="value-bar-column" key={entry.year}>
            <div className="value-bar-track">
              <div
                className="value-bar-fill"
                style={{ height: `${entry.assessedValue ? (entry.assessedValue / maxValue) * 100 : 0}%` }}
                title={entry.assessedValue ? `$${entry.assessedValue.toLocaleString()}` : "No data"}
              />
            </div>
            <span className="value-bar-year">{entry.year}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
