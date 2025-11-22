import React, { useEffect, useRef, useState, useCallback } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

// helper to verify key before enabling the scanner
async function verifyAdmin(pass) {
  const res = await fetch("/api/admin/summary", {
    headers: { "x-admin-password": pass || "" },
  });
  return res.ok;
}

export default function Scan() {
  const [authed, setAuthed] = useState(false);
  const [authMsg, setAuthMsg] = useState("");
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | success | already | error
  const [message, setMessage] = useState("");
  const scannerRef = useRef(null);

  // validate existing key on load
  useEffect(() => {
    const pass = localStorage.getItem("ADMIN_KEY");
    if (!pass) return;
    verifyAdmin(pass).then((ok) => {
      setAuthed(ok);
      if (!ok) localStorage.removeItem("ADMIN_KEY");
    });
  }, []);

  const startScanner = useCallback(() => {
    if (!authed) return;           // don't start unless authed
    if (scannerRef.current) return; // avoid double init

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
    };

    const scanner = new Html5QrcodeScanner("qr-reader", config, false);
    scannerRef.current = scanner;

    scanner.render(
      async (decodedText /*, decodedResult */) => {
        try {
          await scanner.clear();
        } catch {}
        scannerRef.current = null;

        const code = (decodedText || "").trim();
        setResult(code);

        try {
          const pass = localStorage.getItem("ADMIN_KEY") || "";
          const res = await fetch(
            `/api/admin/checkin/${encodeURIComponent(code)}`,
            {
              method: "POST",
              headers: { "x-admin-password": pass },
            }
          );

          if (res.status === 401) {
            setStatus("error");
            setMessage(
              "Not authorized. Open /admin and enter the password."
            );
            return;
          }
          if (!res.ok) {
            setStatus("error");
            setMessage(`Server error (${res.status}).`);
            return;
          }

          const json = await res.json();
          if (json.checkedIn) {
            setStatus("success");
            setMessage(`Checked in: ${json.name ?? ""} (${json.code})`);
          } else {
            setStatus("already");
            setMessage(
              `Already checked / undo: ${json.name ?? ""} (${json.code})`
            );
          }
        } catch {
          setStatus("error");
          setMessage("Network error while calling check-in.");
        }
      },
      () => {
        // ignore continuous scan errors
      }
    );
  }, [authed]);

  // (re)start scanner when auth flips on
  useEffect(() => {
    if (!authed) return;
    startScanner();
    return () => {
      try {
        scannerRef.current?.clear();
      } catch {}
      scannerRef.current = null;
    };
  }, [authed, startScanner]);

  async function handleRescan() {
    setResult(null);
    setStatus("idle");
    setMessage("");
    startScanner();
  }

  async function handleSaveKey(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const v = form.adminKey.value.trim();
    form.reset();

    if (!v) {
      setAuthed(false);
      setAuthMsg("Please enter a key.");
      localStorage.removeItem("ADMIN_KEY");
      return;
    }

    const ok = await verifyAdmin(v);
    if (ok) {
      localStorage.setItem("ADMIN_KEY", v);
      setAuthed(true);
      setAuthMsg("✅ Key accepted. Scanner unlocked.");
      // start scanner right away
      setTimeout(startScanner, 0);
    } else {
      localStorage.removeItem("ADMIN_KEY");
      setAuthed(false);
      setAuthMsg("❌ Incorrect key. Please try again.");
    }
  }

  const bg =
    status === "success"
      ? "#e6ffed"
      : status === "already"
      ? "#fff8db"
      : status === "error"
      ? "#ffe6e6"
      : "#f5f5f5";

  return (
    <main className="card">
      <h1>Scan Ticket</h1>

      {/* Admin key box */}
      <form
        onSubmit={handleSaveKey}
        style={{ textAlign: "right", margin: "8px 0" }}
      >
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
        <p style={{ textAlign: "right", margin: "8px 0" }}>
          <a href="/admin">Back to Admin</a>
        </p>
      )}

      {!authed ? (
        <em>Enter a valid admin key to enable the scanner.</em>
      ) : (
        <>
          <div id="qr-reader" style={{ width: 320, maxWidth: "100%" }} />
          <div
            style={{
              marginTop: 12,
              padding: 10,
              borderRadius: 6,
              background: bg,
            }}
          >
            {result ? (
              <>
                <div style={{ marginBottom: 6 }}>
                  <strong>Last scan:</strong>
                  <pre style={{ margin: 0 }}>{result}</pre>
                </div>
                <div>{message || "Processed."}</div>
                <div style={{ marginTop: 8 }}>
                  <button onClick={handleRescan}>Rescan</button>
                </div>
              </>
            ) : (
              <em>Point your camera at the QR code…</em>
            )}
          </div>
        </>
      )}
    </main>
  );
}
