import React, { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(null);
  const capacity = 200;

  useEffect(() => {
    api.get("/summary").then(r => {
      const used = (r.data.paid || 0) + (r.data.pending || 0);
      setRemaining(Math.max(capacity - used, 0));
    }).catch(() => { });
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());

    // ensure number
    payload.quantity = Number(payload.quantity || 1);
    if (Number.isNaN(payload.quantity) || payload.quantity < 1) {
      alert("Please choose at least 1 ticket.");
      return;
    }

    setLoading(true);
    try {
      // Use fetch directly to simplify debugging
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/checkout/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Show server message if present (e.g., Stripe key/price issues, validation, CORS)
        const msg =
          data?.message ||
          data?.error ||
          `HTTP ${res.status} ${res.statusText}`;
        console.error("Checkout failed:", { status: res.status, data });
        alert(`Failed to start payment: ${msg}`);
        return;
      }

      if (!data?.url) {
        console.error("No checkout URL returned:", data);
        alert("Failed to start payment: No checkout URL.");
        return;
      }

      // Use assignment (window.open can be blocked)
      window.location.assign(data.url);
    } catch (err) {
      console.error("Network error:", err);
      alert(`Failed to start payment: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Somali Society — Event Registration</h1>
      <div className="card">
        {remaining !== null && <p><strong>Spaces remaining:</strong> {remaining}/{capacity}</p>}
        <p>Secure payment; QR ticket on success.</p>
      </div>
      <form className="card" onSubmit={onSubmit}>
        <label>Name<br /><input name="name" required placeholder="Ayaan Ali" /></label><br />
        <label>Email<br /><input name="email" required type="email" placeholder="ayaan@example.com" /></label><br />
        <label>Phone (optional)<br /><input name="phone" placeholder="+44…" /></label><br />
        <label>Tickets<br /><input name="quantity" type="number" min="1" max="10" defaultValue="1" /></label><br />
        <button disabled={loading}>{loading ? "Redirecting…" : "Pay with Stripe"}</button>
      </form>
    </main>
  );
}
