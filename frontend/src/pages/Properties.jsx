import { useEffect, useState } from "react";
import { propertyApi } from "../services/api";
import PropertyCard from "../components/PropertyCard";

export default function Properties() {
  const [properties, setProperties] = useState([]);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    setError("");

    try {
      const data = await propertyApi.list();
      setProperties(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.status === 401
          ? "Your login session is no longer valid. Please log in again."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(event) {
    event.preventDefault();
    const value = address.trim();
    setError("");

    if (!value) {
      await loadAll();
      return;
    }

    setSearching(true);

    try {
      const data = await propertyApi.search(value);
      setProperties(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setProperties([]);
    } finally {
      setSearching(false);
    }
  }

  return (
    <main className="properties-page">
      <section className="property-hero">
        <div className="hero-content">
          <div className="hero-copy">
            <span className="eyebrow">REAL ESTATE DUE DILIGENCE</span>
            <h1>Find a property. Then verify what matters.</h1>
            <p>
              Search the property database and open a property workspace with its profile, history, ownership, tax and zoning checks.
            </p>
          </div>

          <div className="search-shell">
            <div className="search-label">Search by property address</div>
            <form className="search-box" onSubmit={handleSearch}>
              <span className="search-icon">⌕</span>
              <input
                type="search"
                placeholder="e.g. 123 Main Street, Hyderabad"
                value={address}
                onChange={e => setAddress(e.target.value)}
                aria-label="Property address"
              />
              <button className="primary-button" disabled={searching}>
                {searching ? "Searching..." : "Search"}
              </button>
            </form>
            <button className="text-button" onClick={loadAll}>
              View all properties
            </button>
          </div>
        </div>
      </section>

      <section className="results-section">
        <div className="results-heading">
          <div>
            <span className="eyebrow">PROPERTY WORKSPACE</span>
            <h2>{address.trim() ? "Search results" : "Property records"}</h2>
          </div>
          {!loading && (
            <span className="result-count">
              {properties.length} {properties.length === 1 ? "property" : "properties"}
            </span>
          )}
        </div>

        {error && <div className="form-error">{error}</div>}

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            Loading property data...
          </div>
        ) : properties.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">⌂</div>
            <h3>No properties found</h3>
            <p>Try a different address or return to the complete property records.</p>
          </div>
        ) : (
          <div className="property-grid">
            {properties.map(property => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
