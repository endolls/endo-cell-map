"use client";

import { useEffect, useState } from "react";

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    return !!gl;
  } catch {
    return false;
  }
}

export default function WebGLGuard({ children }) {
  const [ok, setOk] = useState(true);

  useEffect(() => {
    setOk(hasWebGL());
  }, []);

  if (!ok) {
    return (
      <div className="webglFallback">
        <strong>WebGL isn’t available in this browser/device.</strong>
        <div style={{ marginTop: 8 }}>
          Try Chrome/Edge/Safari on a newer device, or disable strict tracking /
          battery saver modes.
        </div>
      </div>
    );
  }

  return children;
}