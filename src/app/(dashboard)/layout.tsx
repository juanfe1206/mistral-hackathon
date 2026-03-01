import { PrimaryNav } from "@/components/dashboard/PrimaryNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh" }}>
      <PrimaryNav />
      {children}
    </div>
  );
}
