import { useEffect, useState } from "react";
import { utilityApi } from "../services/api";

const EMPTY_FORM = {
  utilityType: "",
  providerName: "",
  accountNumber: "",
  monthlyCost: "",
  notes: ""
};

export default function UtilitiesPanel({ propertyId }) {
  const [utilities, setUtilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    utilityApi.list(propertyId)
      .then(data => { if (mounted) setUtilities(Array.isArray(data) ? data : []); })
      .catch(err => { if (mounted) setError(err.message || "Unable to load utilities."); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [propertyId]);

  function openAddForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(utility) {
    setEditingId(utility.id);
    setForm({
      utilityType: utility.utilityType || "",
      providerName: utility.providerName || "",
      accountNumber: utility.accountNumber || "",
      monthlyCost: utility.monthlyCost ?? "",
      notes: utility.notes || ""
    });
    setFormError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setFormError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    if (!form.utilityType.trim()) {
      setFormError("Utility type is required (e.g. Water, Electric, Gas).");
      return;
    }

    const payload = {
      utilityType: form.utilityType.trim(),
      providerName: form.providerName.trim() || null,
      accountNumber: form.accountNumber.trim() || null,
      monthlyCost: form.monthlyCost === "" ? null : Number(form.monthlyCost),
      notes: form.notes.trim() || null
    };

    setSaving(true);
    try {
      if (editingId) {
        const updated = await utilityApi.update(propertyId, editingId, payload);
        setUtilities(current => current.map(u => (u.id === editingId ? updated : u)));
      } else {
        const created = await utilityApi.create(propertyId, payload);
        setUtilities(current => [...current, created]);
      }
      closeForm();
    } catch (err) {
      setFormError(err.message || "Unable to save this utility record.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(utilityId) {
    if (!window.confirm("Remove this utility record?")) return;
    try {
      await utilityApi.remove(propertyId, utilityId);
      setUtilities(current => current.filter(u => u.id !== utilityId));
    } catch (err) {
      setError(err.message || "Unable to remove this utility record.");
    }
  }

  return (
    <section className="utilities-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">UTILITIES</span>
          <h2>Utility information</h2>
          <p>Manually entered - each record is stamped with who entered it.</p>
        </div>
        <button className="secondary-button" onClick={openAddForm}>+ Add utility</button>
      </div>

      {showForm && (
        <form className="utility-form" onSubmit={handleSubmit}>
          <div className="utility-form-grid">
            <label>
              Utility type *
              <input
                value={form.utilityType}
                onChange={e => setForm({ ...form, utilityType: e.target.value })}
                placeholder="Water, Electric, Gas, Sewer..."
              />
            </label>
            <label>
              Provider
              <input
                value={form.providerName}
                onChange={e => setForm({ ...form, providerName: e.target.value })}
                placeholder="e.g. Denver Water"
              />
            </label>
            <label>
              Account number
              <input
                value={form.accountNumber}
                onChange={e => setForm({ ...form, accountNumber: e.target.value })}
              />
            </label>
            <label>
              Monthly cost ($)
              <input
                type="number"
                step="0.01"
                value={form.monthlyCost}
                onChange={e => setForm({ ...form, monthlyCost: e.target.value })}
              />
            </label>
          </div>
          <label className="utility-notes-label">
            Notes
            <textarea
              rows="2"
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
            />
          </label>

          {formError && <div className="form-error">{formError}</div>}

          <div className="utility-form-actions">
            <button type="button" className="text-button" onClick={closeForm}>Cancel</button>
            <button className="primary-button compact" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Save changes" : "Add utility"}
            </button>
          </div>
        </form>
      )}

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <div className="history-card loading-history">Loading utility records...</div>
      ) : utilities.length === 0 ? (
        <div className="history-card empty-history">
          <div className="history-icon">⚡</div>
          <div><h3>No utilities on file</h3><p>Add water, electric, gas, or other utility details for this property.</p></div>
        </div>
      ) : (
        <div className="utility-list">
          {utilities.map(utility => (
            <article className="utility-row" key={utility.id}>
              <div className="utility-row-main">
                <strong>{utility.utilityType}</strong>
                <span>{utility.providerName || "Provider not on record"}</span>
                {utility.monthlyCost != null && <span className="utility-cost">${utility.monthlyCost}/mo</span>}
              </div>
              {utility.notes && <p className="utility-notes">{utility.notes}</p>}
              <div className="utility-row-footer">
                <small>Entered by {utility.source || "Manual Entry"}</small>
                <div className="utility-row-actions">
                  <button className="text-button" onClick={() => openEditForm(utility)}>Edit</button>
                  <button className="text-button danger" onClick={() => handleDelete(utility.id)}>Delete</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
