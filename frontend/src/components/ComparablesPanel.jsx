import { useEffect, useState } from "react";
import { propertyApi } from "../services/api";

export default function ComparablesPanel({ propertyId }) {
  const [listings, setListings] = useState(null);
  const [trends, setTrends] = useState(null);
  const [sortBy, setSortBy] = useState("distance");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    Promise.allSettled([
      propertyApi.comparables(propertyId, sortBy),
      propertyApi.comparableTrends(propertyId)
    ]).then(([listingsResult, trendsResult]) => {
      if (!mounted) return;
      if (listingsResult.status === "fulfilled") {
        setListings(Array.isArray(listingsResult.value) ? listingsResult.value : []);
      } else {
        setError(listingsResult.reason?.message || "Unable to load comparable listings.");
      }
      if (trendsResult.status === "fulfilled") {
        setTrends(trendsResult.value);
      }
      setLoading(false);
    });

    return () => { mounted = false; };
  }, [propertyId, sortBy]);

  return (
    <section className="comparables-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">MARKET COMPARABLES</span>
          <h2>Comparable listings</h2>
          <p>Nearby listings pulled from RapidAPI, saved to the database, and refreshed automatically after 30 days.</p>
        </div>
        <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="distance">Sort: Distance</option>
          <option value="price">Sort: Price</option>
          <option value="listed_date">Sort: Listed date</option>
        </select>
      </div>

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <div className="history-card loading-history">Loading comparable listings...</div>
      ) : !listings || listings.length === 0 ? (
        <div className="history-card empty-history">
          <div className="history-icon">🏘</div>
          <div><h3>No comparable listings yet</h3><p>No nearby listings are available for this property yet, or RapidAPI hasn't been configured on the backend.</p></div>
        </div>
      ) : (
        <>
          {trends && (
            <div className="trend-summary">
              <TrendStat label="Average price" value={trends.averagePrice != null ? `$${Math.round(trends.averagePrice).toLocaleString()}` : "—"} />
              <TrendStat label="Avg price / sqft" value={trends.averagePricePerSquareFoot != null ? `$${trends.averagePricePerSquareFoot.toFixed(0)}` : "—"} />
              <TrendStat label="Recency-weighted avg" value={trends.recencyWeightedAveragePrice != null ? `$${Math.round(trends.recencyWeightedAveragePrice).toLocaleString()}` : "—"} />
              <TrendStat label="Listings" value={trends.listingCount ?? listings.length} />
            </div>
          )}

          <div className="comparable-list">
            {listings.map(listing => (
              <article className="comparable-card" key={listing.id}>
                <div className="comparable-top">
                  <strong>{listing.comparableAddress || "Address unavailable"}</strong>
                  <span className="comparable-price">
                    {listing.price != null ? `$${listing.price.toLocaleString()}` : "Price unavailable"}
                  </span>
                </div>
                <div className="comparable-meta">
                  <span>{listing.distanceMiles != null ? `${listing.distanceMiles.toFixed(1)} mi away` : "Distance unavailable"}</span>
                  <span>{listing.squareFeet != null ? `${listing.squareFeet.toLocaleString()} ft²` : "Size unavailable"}</span>
                  <span>{listing.listedDate ? `Listed ${listing.listedDate}` : "Listed date unavailable"}</span>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function TrendStat({ label, value }) {
  return (
    <div className="trend-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
