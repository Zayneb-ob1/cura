"use client";

export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, background: "#f3f0e9", color: "#252824", fontFamily: "Arial, sans-serif" }}>
        <title>Erreur | CURA</title>
        <main style={{ minHeight: "100vh", padding: "clamp(40px, 8vw, 100px) 24px", display: "grid", placeItems: "center" }}>
          <section style={{ width: "min(100%, 680px)", textAlign: "center" }} role="alert">
            <p style={{ margin: "0 0 18px", color: "#806838", fontSize: 12, textTransform: "uppercase" }}>CURA</p>
            <h1 style={{ margin: "0 0 18px", fontFamily: "Georgia, serif", fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 400 }}>
              Cette page ne peut pas être affichée.
            </h1>
            <p>Er is iets misgegaan. Probeer het opnieuw.</p>
            <button
              type="button"
              onClick={retry}
              style={{ marginTop: 20, minHeight: 44, padding: "0 24px", border: 0, background: "#1b6b56", color: "#fff", cursor: "pointer" }}
            >
              Réessayer / Opnieuw proberen
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
