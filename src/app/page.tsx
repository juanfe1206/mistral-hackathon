import Image from "next/image";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <main style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2rem", padding: "2rem" }}>
        <Image
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>
          Mistral Lead Ops
        </h1>
        <p>To get started, edit <code>src/app/page.tsx</code>.</p>
      </main>
    </div>
  );
}
