import Link from "next/link";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <main style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2rem", padding: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>
          Mistral Lead Ops
        </h1>
        <p>Lead operations platform for salon operators.</p>
        <Link
          href="/triage"
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "var(--foreground)",
            color: "var(--background)",
            textDecoration: "none",
            borderRadius: 6,
          }}
        >
          Open Triage Queue
        </Link>
      </main>
    </div>
  );
}
