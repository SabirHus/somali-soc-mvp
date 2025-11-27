// web/src/lib/api.js

// Base origin for the API; prefer env, fall back to local server port
const ORIGIN = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Add /api prefix so client calls /api/*
const API_BASE = `${ORIGIN}/api`;

// Minimal axios-like wrapper on top of fetch
async function request(path, opts = {}) {
  // Retrieve token from localStorage for all authenticated requests
  const token = localStorage.getItem('adminToken');
  const headers = { 
    "Content-Type": "application/json", 
    ...(opts.headers || {}) 
  };
  
  if (token && path.startsWith('/auth')) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    headers: headers,
    credentials: "include",
    ...opts,
    body:
      opts.body && typeof opts.body !== "string"
        ? JSON.stringify(opts.body)
        : opts.body,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errorText}`);
  }

  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

export const api = {
  get:  (p)        => request(p, { method: "GET" }),
  post: (p, body)  => request(p, { method: "POST", body }),
  put:  (p, body)  => request(p, { method: "PUT", body }),
  delete: (p)      => request(p, { method: "DELETE" }),
}