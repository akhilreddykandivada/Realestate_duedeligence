const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

async function request(url, options = {}) {
  const token = localStorage.getItem("realEstateToken");

  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  });

  const contentType = response.headers.get("content-type") || "";
  let data;

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const message =
      typeof data === "string"
        ? data
        : data?.message ||
          data?.error ||
          data?.detail ||
          data?.errors?.[0]?.defaultMessage ||
          `Request failed with status ${response.status}`;

    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/** Downloads a binary file (PDF/Excel) and triggers the browser's save dialog. */
async function downloadFile(url, filename) {
  const token = localStorage.getItem("realEstateToken");

  const response = await fetch(`${API_BASE}${url}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  if (!response.ok) {
    let message = `Download failed with status ${response.status}`;
    try {
      const data = await response.json();
      message = data?.message || message;
    } catch {
      // response wasn't JSON - keep the default message
    }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);
}

export const authApi = {
  register(payload) {
    return request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  login(payload) {
    return request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }
};

export const propertyApi = {
  list() {
    return request("/api/properties");
  },

  search(address) {
    return request(
      `/api/properties/search?address=${encodeURIComponent(address)}`
    );
  },

  details(id) {
    return request(`/api/properties/${encodeURIComponent(id)}`);
  },

  validateAddress(address) {
    return request("/api/properties/validate_address", {
      method: "POST",
      body: JSON.stringify({ address })
    });
  },

  history(id) {
    return request(`/api/properties/${encodeURIComponent(id)}/history`);
  },

  ownership(id) {
    return request(`/api/properties/${encodeURIComponent(id)}/ownership`);
  },

  taxHistory(id) {
    return request(`/api/properties/${encodeURIComponent(id)}/tax-history`);
  },

  zoning(id) {
    return request(`/api/properties/${encodeURIComponent(id)}/zoning`);
  },

  floodZone(id) {
    return request(`/api/properties/${encodeURIComponent(id)}/flood-zone`);
  },

  permits(id) {
    return request(`/api/properties/${encodeURIComponent(id)}/permits`);
  },

  environmental(id) {
    return request(`/api/properties/${encodeURIComponent(id)}/environmental`);
  },

  /** Runs all 7 due-diligence sections in parallel on the backend in one call. */
  dueDiligence(id) {
    return request(`/api/properties/${encodeURIComponent(id)}/due-diligence`);
  },

  /** sortBy: "distance" (default) | "price" | "listed_date" */
  comparables(id, sortBy = "distance") {
    return request(
      `/api/properties/${encodeURIComponent(id)}/comparables?sortBy=${encodeURIComponent(sortBy)}`
    );
  },

  comparableTrends(id) {
    return request(`/api/properties/${encodeURIComponent(id)}/comparables/trends`);
  },

  valueHistory(id) {
    return request(`/api/properties/${encodeURIComponent(id)}/value-history`);
  }
};

export const utilityApi = {
  list(propertyId) {
    return request(`/api/properties/${encodeURIComponent(propertyId)}/utilities`);
  },
  create(propertyId, payload) {
    return request(`/api/properties/${encodeURIComponent(propertyId)}/utilities`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  update(propertyId, utilityId, payload) {
    return request(
      `/api/properties/${encodeURIComponent(propertyId)}/utilities/${encodeURIComponent(utilityId)}`,
      { method: "PUT", body: JSON.stringify(payload) }
    );
  },
  remove(propertyId, utilityId) {
    return request(
      `/api/properties/${encodeURIComponent(propertyId)}/utilities/${encodeURIComponent(utilityId)}`,
      { method: "DELETE" }
    );
  }
};

export const reportApi = {
  /**
   * Runs the FULL pipeline (due diligence -> risk assessment ->
   * comparables -> timeline -> executive summary -> PDF/Excel export) and
   * returns the complete report immediately.
   */
  createReport(propertyId) {
    return request(`/api/properties/${encodeURIComponent(propertyId)}/reports`, {
      method: "POST"
    });
  },
  /** Faster, risk-only check - no comparables/timeline/PDF/Excel. */
  runRiskAssessment(propertyId) {
    return request(`/api/properties/${encodeURIComponent(propertyId)}/risk-assessment`, {
      method: "POST"
    });
  },
  getReport(reportId) {
    return request(`/api/reports/${encodeURIComponent(reportId)}`);
  },
  getUserReports(userId) {
    return request(`/api/reports?user=${encodeURIComponent(userId)}`);
  },
  downloadPdf(reportId) {
    return downloadFile(`/api/reports/${encodeURIComponent(reportId)}/pdf`, `report-${reportId}.pdf`);
  },
  downloadExcel(reportId) {
    return downloadFile(`/api/reports/${encodeURIComponent(reportId)}/excel`, `report-${reportId}.xlsx`);
  }
};


export const userApi = {
  getProfile() {
    return request("/api/users/me");
  },
  updateProfile(payload) {
    return request("/api/users/me", {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  },
  changePassword(payload) {
    return request("/api/users/me/password", {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  },
  ownedProperties() {
    return request("/api/users/me/properties");
  }
};
