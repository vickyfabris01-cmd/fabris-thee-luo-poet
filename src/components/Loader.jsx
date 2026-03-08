import React from "react";

export default function Loader({ size = 'medium', message = 'Loading...' }) {
  const sizeMap = {
    small: { spinner: 20, container: 40 },
    medium: { spinner: 32, container: 60 },
    large: { spinner: 48, container: 80 },
  };

  const { spinner, container } = sizeMap[size];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 20,
      }}
    >
      <div
        style={{
          width: container,
          height: container,
          border: `3px solid var(--border)`,
          borderTop: `3px solid var(--accent)`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      {message && <div style={{ color: 'var(--muted)', fontSize: 14 }}>{message}</div>}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
