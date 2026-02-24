"use client";

import { useEffect, useMemo, useRef } from "react";

function pct(x) {
  const v = Math.max(0, Math.min(100, Number(x) || 0));
  return Math.round(v);
}

export default function ScenarioChat({ open, setOpen, messages }) {
  const boxRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    // auto-scroll to bottom when messages change
    const el = boxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  return (
    <div className="chatWrap">
      <button className="chatBtn" onClick={() => setOpen(!open)}>
        {open ? "Hide guide" : "Guide (what’s happening?)"}
      </button>

      {open && (
        <div className="chatCard" ref={boxRef}>
          {messages.map((m) => (
            <div key={m.id} className={`chatBubble ${m.kind || "system"}`}>
              <div className="chatText">{m.text}</div>
              {m.meta ? <div className="chatMeta">{m.meta}</div> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
