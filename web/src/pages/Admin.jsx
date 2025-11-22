import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchAdminAttendees,
  fetchAdminSummary,
  toggleCheckin,
} from "../lib/api.js";

// Small helper: ask the server if a key is valid
async function verifyAdmin(pass) {
  const res = await fetch("/api/admin/summary", {
    headers: { "x-admin-password": pass || "" },
  });
  return res.ok;
}

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [authMsg, setAuthMsg] = useState(""); // success/error message under the form

  // try existing key on first load
  useEffect(() => {
    const pass = localStorage.getItem("ADMIN_PASS");
    if (!pass) return;
    verifyAdmin(pass).then((ok) => {
      setAuthed(ok);
      if (!ok) {
        localStorage.removeItem("ADMIN_PASS");
      }
    });
  }, []);

  // --- admin key form handler
  async function handleSaveKey(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const v = form.adminKey.value.trim();

    // always reset the form field after submit
    form.reset();

    if (!v) {
      setAuthed(false);
      setAuthMsg("Please enter a key.");
      localStorage.removeItem("ADMIN_PASS");
      return;
    }

    const ok = await verifyAdmin(v);
    if (ok) {
      localStorage.setItem("ADMIN_PASS", v);
      setAuthed(true);
      setAuthMsg("✅ Key accepted. Admin actions unlocked.");
    } else {
      localStorage.removeItem("ADMIN_PASS");
      setAuthed(false);
      setAuthMsg("❌ Incorrect key. Please try again.");
    }
  }

  // ---------- normal admin UI (only when authed) ----------
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ paid: 0, pending: 0 });

  // load summary once (only if authed)
  useEffect(() => {
    if (!authed) return;
    (async () => {
      try {
        const s = await fetchAdminSummary();
        setSummary(s);
      } catch (e) {
        console.error("summary error", e);
      }
    })();
  }, [authed]);

  // load attendees whenever q changes (simple debounce, only if authed)
  useEffect(() => {
    if (!authed) return;
    let stop = false;
    const id = setTimeout(async () => {
      setLoading(true);
      try {
        const list = await fetchAdminAttendees(q);
        if (!stop) setRows(list);
      } catch (e) {
        console.error("attendees error", e);
      } finally {
        if (!stop) setLoading(false);
      }
    }, 250);

    return () => {
      stop = true;
      clearTimeout(id);
    };
  }, [q, authed]);

  async function onToggle(code) {
    try {
      const updated = await toggleCheckin(code);
      setRows((prev) =>
        prev.map((r) => (r.code === updated.code ? updated : r))
      );
    } catch (e) {
      alert("Failed to toggle check-in");
      console.error(e);
    }
  }

  const count = useMemo(() => rows.length, [rows]);

  return (
    <main>
      {/* Admin key box (always visible) */}
      <div className="card" style={{ marginBottom: 12 }}>
        <h1>Admin</h1>

        <form onSubmit={handleSaveKey} style={{ textAlign: "right", margin: "8px 0" }}>
          <input
            name="adminKey"
            type="password"
            placeholder="Admin key"
            autoComplete="off"
            style={{ marginRight: 8 }}
          />
          <button type="submit">Save</button>
        </form>

        {authMsg && (
          <div style={{ marginTop: 6 }}>
            <em>{authMsg}</em>
          </div>
        )}

        {authed && (
          <p style={{ marginTop: 8 }}>
            <strong>Paid:</strong> {summary.paid} &nbsp;|&nbsp;{" "}
            <strong>Pending:</strong> {summary.pending}
          </p>
        )}
      </div>

      {!authed ? (
        <div className="card">
          <em>Enter a valid admin key to unlock the dashboard.</em>
        </div>
      ) : (
        <>
          <div className="card">
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <input
                placeholder="Search name / email / code…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <span>{loading ? "Loading…" : `${count} results`}</span>
              <Link to="/admin/scan" className="button">
                Open scanner
              </Link>
            </div>
          </div>

          <div className="card">
            <table width="100%">
              <thead>
                <tr>
                  <th align="left">Name</th>
                  <th align="left">Email</th>
                  <th align="left">Phone</th>
                  <th align="left">Code</th>
                  <th align="left">Status</th>
                  <th align="left">Checked-in</th>
                  <th align="left"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.code}>
                    <td>{r.name}</td>
                    <td>{r.email}</td>
                    <td>{r.phone}</td>
                    <td>
                      <code>{r.code}</code>
                    </td>
                    <td>{r.status}</td>
                    <td>{r.checkedIn ? "Yes" : "No"}</td>
                    <td>
                      <button onClick={() => onToggle(r.code)}>
                        {r.checkedIn ? "Un-check" : "Check in"}
                      </button>
                    </td>
                  </tr>
                ))}
                {!rows.length && !loading && (
                  <tr>
                    <td colSpan={7}>
                      <em>No attendees found.</em>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
