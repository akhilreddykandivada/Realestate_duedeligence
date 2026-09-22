import { useState } from "react";
import { propertyApi } from "../services/api";

export default function AddressValidation() {
  const [address, setAddress] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setResult(null);

    if (!address.trim()) {
      setError("Enter an address to validate.");
      return;
    }

    setLoading(true);

    try {
      const data = await propertyApi.validateAddress(address.trim());
      setResult(data);

      if (data.valid) {
        setAddress(data.cleanAddress || address.trim());
      }
    } catch (err) {
      setError(
        err.status === 503
          ? "The address verification service is temporarily unavailable. Please try again."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="tool-page">
      <section className="tool-hero">
        <span className="eyebrow">ADDRESS VALIDATION</span>
        <h1>Verify an address before due diligence.</h1>
        <p>
          Google Geocoding checks the address and returns a clean formatted
          address with geographic coordinates.
        </p>
      </section>

      <section className="tool-card">
        <form className="validation-form" onSubmit={handleSubmit}>
          <label>
            Property address
            <textarea
              rows="3"
              placeholder="Enter the complete property address"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </label>

          {error && <div className="form-error">{error}</div>}

          <button className="primary-button" disabled={loading}>
            {loading ? "Verifying address..." : "Validate address"}
          </button>
        </form>

        {result && (
          <div className={`validation-result ${result.valid ? "valid" : "invalid"}`}>
            <div className="result-status">
              <span className="status-dot" />
              <strong>{result.valid ? "Address verified" : "Address not verified"}</strong>
            </div>

            {result.valid ? (
              <>
                <div className="coordinate-grid">
                  <ResultField label="Clean address" value={result.cleanAddress} wide />
                  <ResultField label="Latitude" value={result.latitude} />
                  <ResultField label="Longitude" value={result.longitude} />
                  <ResultField label="Verified by" value={result.provider || "Geocoding service"} wide />
                </div>
                <p className="validation-message">{result.message}</p>
              </>
            ) : (
              <p>{result.message || "The address could not be verified."}</p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function ResultField({ label, value, wide }) {
  return (
    <div className={`result-field ${wide ? "wide" : ""}`}>
      <span>{label}</span>
      <strong>{value ?? "Not available"}</strong>
    </div>
  );
}
