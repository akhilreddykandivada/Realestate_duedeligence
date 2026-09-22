import { Link } from "react-router-dom";

export default function PropertyCard({ property }) {
  return (
    <article className="property-card">
      <div className="property-card-top">
        <span>PROPERTY #{property.id}</span>
        <span className="property-type">{property.type || "Property"}</span>
      </div>

      <h3>{property.address}</h3>
      <p className="property-location">
        {property.location || "Location not available"}
      </p>

      <div className="property-facts">
        <Fact label="Beds" value={property.bedrooms} />
        <Fact label="Baths" value={property.bathrooms} />
        <Fact label="Area" value={property.squareFeet ? `${property.squareFeet} ft²` : "—"} />
      </div>

      <Link className="view-details" to={`/properties/${property.id}`}>
        View property details →
      </Link>
    </article>
  );
}

function Fact({ label, value }) {
  return (
    <span>
      {label}
      <strong>{value ?? "—"}</strong>
    </span>
  );
}
