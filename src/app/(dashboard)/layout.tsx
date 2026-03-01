import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh" }}>
      <nav
        role="navigation"
        aria-label="Primary navigation"
        style={{
          display: "flex",
          gap: "1rem",
          padding: "1rem 1.5rem",
          borderBottom: "1px solid rgba(128,128,128,0.2)",
          backgroundColor: "var(--background)",
        }}
      >
        <Link
          href="/triage"
          style={{
            textDecoration: "none",
            color: "var(--foreground)",
            fontWeight: 500,
          }}
        >
          Triage
        </Link>
        <Link
          href="/at-risk"
          style={{
            textDecoration: "none",
            color: "var(--foreground)",
            fontWeight: 500,
          }}
        >
          At-Risk
        </Link>
        <Link
          href="/insights"
          style={{
            textDecoration: "none",
            color: "var(--foreground)",
            fontWeight: 500,
          }}
        >
          Queue Insights
        </Link>
        <Link
          href="/settings"
          style={{
            textDecoration: "none",
            color: "var(--foreground)",
            fontWeight: 500,
          }}
        >
          Settings
        </Link>
        <Link
          href="/"
          style={{
            textDecoration: "none",
            color: "var(--foreground)",
            opacity: 0.7,
            fontSize: "0.875rem",
          }}
        >
          Home
        </Link>
      </nav>
      {children}
    </div>
  );
}
