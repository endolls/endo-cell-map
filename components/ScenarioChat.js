"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function useTypewriter(text, enabled = true, cps = 55) {
  const [out, setOut] = useState("");
  const idx = useRef(0);
  const timer = useRef(null);

  useEffect(() => {
    if (!enabled) {
      setOut(text);
      return;
    }

    idx.current = 0;
    setOut("");

    if (timer.current) clearInterval(timer.current);

    // chars per second -> interval step
    const stepMs = 30;
    const charsPerTick = Math.max(1, Math.floor((cps * stepMs) / 1000));

    timer.current = setInterval(() => {
      idx.current += charsPerTick;
      const slice = text.slice(0, idx.current);
      setOut(slice);
      if (idx.current >= text.length) {
        clearInterval(timer.current);
        timer.current = null;
      }
    }, stepMs);

    return () => {
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
    };
  }, [text, enabled, cps]);

  return out;
}

export default function ScenarioChat({
  open,
  setOpen,
  title,
  scriptText,
  typing = true
}) {
  const [skip, setSkip] = useState(false);
  const typed = useTypewriter(scriptText, typing && !skip, 60);

  useEffect(() => {
    // whenever the script changes, start typing again
    setSkip(false);
  }, [scriptText]);

  return (
    <div className="chatWrap">
      <button className="chatBtn" onClick={() => setOpen(!open)}>
        {open ? "Hide guide" : "Guide (what’s happening?)"}
      </button>

      {open && (
        <div className="chatCard">
          <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 800, fontSize: 12 }}>{title || "Guide"}</div>
            <button
              style={{
                border: "1px solid rgba(255,255,255,0.16)",
                background: "rgba(255,255,255,0.06)",
                color: "rgba(230,233,242,0.95)",
                padding: "7px 10px",
                borderRadius: 10,
                cursor: "pointer",
                fontSize: 12
              }}
              onClick={() => setSkip(true)}
              title="Show full text immediately"
            >
              Skip typing
            </button>
          </div>

          <div
            style={{
              marginTop: 10,
              whiteSpace: "pre-wrap",
              fontSize: 12,
              lineHeight: 1.4,
              color: "rgba(230,233,242,0.95)"
            }}
          >
            {typed}
          </div>
        </div>
      )}
    </div>
  );
}
