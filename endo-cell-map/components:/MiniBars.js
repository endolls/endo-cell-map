"use client";

export function Bar({ label, value }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="barWrap">
      <div className="barLabel">{label}</div>
      <div className="barOuter">
        <div className="barInner" style={{ width: `${v}%` }} />
      </div>
      <div className="barVal">{Math.round(v)}</div>
    </div>
  );
}