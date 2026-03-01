"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Stack } from "@mui/material";

const NAV_LINKS: Array<{ href: string; label: string }> = [
  { href: "/triage", label: "Triage" },
  { href: "/at-risk", label: "At-Risk" },
  { href: "/insights", label: "Queue Insights" },
  { href: "/settings", label: "Settings" },
  { href: "/", label: "Home" },
];

export function PrimaryNav() {
  const pathname = usePathname();

  return (
    <Box
      component="nav"
      role="navigation"
      aria-label="Primary navigation"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        borderBottom: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Stack
        direction="row"
        spacing={0.75}
        sx={{
          px: { xs: 1, sm: 2 },
          py: 1,
          overflowX: "auto",
          whiteSpace: "nowrap",
        }}
      >
        {NAV_LINKS.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              style={{
                textDecoration: "none",
                color: "var(--foreground)",
                fontWeight: isActive ? 700 : 500,
                borderRadius: 8,
                padding: "0.45rem 0.75rem",
                border: isActive ? "1px solid rgba(45, 58, 58, 0.35)" : "1px solid transparent",
                backgroundColor: isActive ? "rgba(45, 58, 58, 0.08)" : "transparent",
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </Stack>
    </Box>
  );
}
