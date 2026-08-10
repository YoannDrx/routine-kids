"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="fr">
      <body
        style={{
          alignItems: "center",
          background: "#120d2b",
          color: "white",
          display: "flex",
          fontFamily: "system-ui, sans-serif",
          justifyContent: "center",
          margin: 0,
          minHeight: "100vh",
          padding: 24,
        }}
      >
        <main style={{ maxWidth: 520, textAlign: "center" }}>
          <p style={{ color: "#8fd8ff", fontWeight: 700 }}>RoutineKids</p>
          <h1>Impossible de charger l’application</h1>
          <p style={{ color: "#d8d3e8", lineHeight: 1.6 }}>
            Vérifiez votre connexion puis relancez l’affichage.
          </p>
          <button
            onClick={reset}
            style={{
              background: "white",
              border: 0,
              borderRadius: 999,
              color: "#120d2b",
              cursor: "pointer",
              fontWeight: 700,
              marginTop: 16,
              padding: "14px 22px",
            }}
            type="button"
          >
            Réessayer
          </button>
        </main>
      </body>
    </html>
  );
}
