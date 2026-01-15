import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import "./App.css";

// ✅ IMPORTANT: Use Render backend URL (NOT localhost)
const API_BASE = "https://fakejobdetector-qz8s.onrender.com";

function App() {
  const [form, setForm] = useState({
    title: "",
    company: "",
    description: "",
    url: "", // ✅ NEW
  });

  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("job_history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  // ✅ Save history to localStorage
  useEffect(() => {
    localStorage.setItem("job_history", JSON.stringify(history));
  }, [history]);

  // ✅ Handle Input Changes
  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const resetForm = () => {
    setForm({
      title: "",
      company: "",
      description: "",
      url: "",
    });
    setResult(null);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("job_history");
  };

  // ✅ URL/Website Verification (Simple Heuristics)
  const analyzeURL = (url) => {
    if (!url || url.trim() === "") return null;

    const lower = url.toLowerCase().trim();
    let reasons = [];

    // suspicious TLDs
    const suspiciousTLDs = [
      ".xyz",
      ".top",
      ".site",
      ".online",
      ".loan",
      ".buzz",
    ];
    suspiciousTLDs.forEach((tld) => {
      if (lower.includes(tld))
        reasons.push(`Suspicious domain extension (${tld})`);
    });

    // too many digits
    const digits = lower.replace(/[^0-9]/g, "").length;
    if (digits >= 6) reasons.push("Domain contains too many numbers");

    // scam words
    const scamWords = ["free", "money", "earn", "win", "bonus", "instant", "join"];
    scamWords.forEach((word) => {
      if (lower.includes(word))
        reasons.push(`Contains suspicious keyword: "${word}"`);
    });

    // no https
    if (lower.startsWith("http://"))
      reasons.push("Not using HTTPS (http://)");

    // invalid url format
    try {
      // eslint-disable-next-line no-new
      new URL(lower);
    } catch {
      reasons.push("URL format looks invalid");
    }

    return {
      status: reasons.length >= 2 ? "SUSPICIOUS" : "SAFE",
      reasons,
    };
  };

  // ✅ Memoized URL analysis (better performance)
  const urlCheck = useMemo(() => analyzeURL(form.url), [form.url]);

  // ✅ Submit Job for Prediction
  const submitJob = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await axios.post(`${API_BASE}/predict`, {
        title: form.title,
        company: form.company,
        description: form.description,
      });

      const data = response.data;

      // ✅ Production error format
      if (data.success === false) {
        alert(data.error || "Something went wrong!");
        return;
      }

      const record = {
        id: Date.now(),
        title: form.title,
        company: form.company,
        description: form.description,
        url: form.url,

        // ✅ backend outputs
        result: data.result,
        model_result: data.model_result,
        confidence: data.confidence,
        red_flags: data.red_flags || [],
        risk_level: data.risk_level,
        warning: data.warning || null,

        // ✅ URL verification stored
        url_status: urlCheck?.status || "NOT_PROVIDED",
        url_reasons: urlCheck?.reasons || [],

        time: new Date().toLocaleString(),
      };

      setResult(record);
      setHistory((prev) => [record, ...prev].slice(0, 5));
    } catch (err) {
      console.error("❌ API Error:", err);
      alert("Backend not responding. Please ensure backend is deployed & running!");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Clickable History Load
  const loadHistoryItem = (item) => {
    setResult(item);
    setForm({
      title: item.title,
      company: item.company,
      description: item.description,
      url: item.url || "",
    });
    window.location.hash = "#results";
  };

  // ✅ PDF Download
  const downloadPDF = () => {
    if (!result) return;

    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Fake Job Posting Detector Report", 14, 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    let y = 32;
    const addLine = (text) => {
      doc.text(text, 14, y);
      y += 8;
    };

    addLine(`Date & Time: ${result.time}`);
    addLine(`Job Title: ${result.title}`);
    addLine(`Company: ${result.company}`);
    addLine(`Final Prediction: ${result.result}`);
    addLine(`Model Prediction: ${result.model_result}`);
    addLine(`Confidence: ${result.confidence}%`);
    addLine(`Risk Level: ${result.risk_level}`);

    y += 4;
    doc.setFont("helvetica", "bold");
    doc.text("URL Verification:", 14, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    addLine(`URL: ${result.url || "Not provided"}`);
    addLine(`URL Status: ${result.url_status}`);

    if (result.url_reasons && result.url_reasons.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("URL Reasons:", 14, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      result.url_reasons.forEach((r) => {
        doc.text(`- ${r}`, 18, y);
        y += 7;
      });
    }

    if (result.warning) {
      y += 4;
      doc.setFont("helvetica", "bold");
      doc.text("Warning:", 14, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.text(doc.splitTextToSize(result.warning, 180), 14, y);
      y += 10;
    }

    y += 4;
    doc.setFont("helvetica", "bold");
    doc.text("Red Flags:", 14, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    if (result.red_flags.length > 0) {
      result.red_flags.forEach((flag) => {
        doc.text(`- ${flag}`, 18, y);
        y += 7;
      });
    } else {
      doc.text("No suspicious patterns detected ✅", 18, y);
      y += 7;
    }

    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text("Description (Preview):", 14, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    const preview = result.description.slice(0, 500) + "...";
    const lines = doc.splitTextToSize(preview, 180);
    doc.text(lines, 14, y);

    doc.save("Fake_Job_Report.pdf");
  };

  return (
    <div className="page">
      {/* ✅ NAVBAR */}
      <nav className="navbar">
        <div className="navLeft">
          <span className="logo">FakeJobDetector</span>
        </div>

        <div className="navRight">
          <a href="#check">Check Job</a>
          <a href="#results">Results</a>
          <a href="#history">History</a>
        </div>
      </nav>

      <header className="header">
        <h1>Fake Job Posting Detector</h1>
        <p className="subtext">
          AI-based job scam detection with red flags + report export + URL verification
        </p>
      </header>

      <main className="grid">
        {/* ✅ LEFT: FORM */}
        <section className="panel" id="check">
          <h2 className="panelTitle">Check a Job Post</h2>

          <form onSubmit={submitJob} className="form">
            <label>
              Job Title
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g., Data Entry Operator"
                required
              />
            </label>

            <label>
              Company Name
              <input
                name="company"
                value={form.company}
                onChange={handleChange}
                placeholder="e.g., Global Solutions"
                required
              />
            </label>

            <label>
              Job URL / Company Website (Optional)
              <input
                name="url"
                value={form.url}
                onChange={handleChange}
                placeholder="e.g., https://company.com/job"
              />
            </label>

            {/* ✅ URL Quick Verification */}
            {form.url.trim() !== "" && urlCheck && (
              <div
                className={
                  urlCheck.status === "SUSPICIOUS"
                    ? "urlBox danger"
                    : "urlBox safe"
                }
              >
                <b>URL Check:</b> {urlCheck.status}
                {urlCheck.reasons.length > 0 && (
                  <ul>
                    {urlCheck.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <label>
              Job Description
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Paste full job description..."
                rows={7}
                required
              />
            </label>

            <div className="actions">
              <button className="btnPrimary" type="submit" disabled={loading}>
                {loading ? "Checking..." : "Detect Fake / Real"}
              </button>

              <button className="btnSecondary" type="button" onClick={resetForm}>
                Clear
              </button>
            </div>
          </form>
        </section>

        {/* ✅ RIGHT: RESULT + HISTORY */}
        <section className="panel" id="results">
          <h2 className="panelTitle">Results</h2>

          {!result ? (
            <div className="emptyState">
              <p>Enter job details and click Detect ✅</p>
            </div>
          ) : (
            <div className="resultCard">
              <div className="badges">
                <span
                  className={
                    result.result === "FAKE"
                      ? "badge badgeDanger"
                      : "badge badgeSuccess"
                  }
                >
                  {result.result}
                </span>

                <span
                  className={
                    result.risk_level === "HIGH"
                      ? "badge badgeDanger"
                      : result.risk_level === "MEDIUM"
                      ? "badge badgeWarn"
                      : "badge badgeSuccess"
                  }
                >
                  Risk: {result.risk_level}
                </span>
              </div>

              <p>
                <b>Confidence:</b> {result.confidence}%
              </p>

              <div className="progressBar">
                <div
                  className="progressFill"
                  style={{ width: `${result.confidence}%` }}
                />
              </div>

              {/* ✅ Warning */}
              {result.warning && (
                <p className="warningText">⚠️ {result.warning}</p>
              )}

              {/* ✅ URL Status */}
              {result.url && (
                <div
                  className={
                    result.url_status === "SUSPICIOUS"
                      ? "urlBox danger"
                      : "urlBox safe"
                  }
                >
                  <b>URL Status:</b> {result.url_status}
                  {result.url_reasons.length > 0 && (
                    <ul>
                      {result.url_reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <h3 className="sectionTitle">
                {result.red_flags.length > 0
                  ? "🚩 Suspicious Red Flags Found"
                  : "✅ Red Flags Check Passed"}
              </h3>

              {result.red_flags.length > 0 ? (
                <ul className="flagList">
                  {result.red_flags.map((flag, idx) => (
                    <li key={idx}>🚩 {flag}</li>
                  ))}
                </ul>
              ) : (
                <p className="safeText">No suspicious patterns detected ✅</p>
              )}

              <button className="btnGreen" type="button" onClick={downloadPDF}>
                Download PDF Report
              </button>
            </div>
          )}

          {/* ✅ HISTORY */}
          <div className="historyHeader" id="history">
            <h2 className="panelTitle">History (Last 5)</h2>

            {history.length > 0 && (
              <button
                className="btnDangerSmall"
                type="button"
                onClick={clearHistory}
              >
                Clear
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <p className="safeText">No history yet ✅</p>
          ) : (
            <div className="historyList">
              {history.map((h) => (
                <div
                  className="historyItem clickable"
                  key={h.id}
                  onClick={() => loadHistoryItem(h)}
                >
                  <p className="historyTitle">
                    <b>{h.title}</b> — {h.company}
                  </p>

                  <p className="historyMeta">
                    <span
                      className={
                        h.result === "FAKE" ? "miniTag danger" : "miniTag success"
                      }
                    >
                      {h.result}
                    </span>
                    <span className="miniTag neutral">{h.confidence}%</span>
                    <span className="miniTag neutral">{h.time}</span>
                  </p>

                  <p className="smallHint">Click to view again</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        <p>© 2026 Fake Job Posting Detector | All Rights Reserved</p>
      </footer>
    </div>
  );
}

export default App;
