import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";

export default function Home() {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <main>
        <Stack spacing={3} alignItems="center" sx={{ p: 3 }}>
          <Typography variant="h1" component="h1">
            Mistral Lead Ops
          </Typography>
          <Typography variant="body1">Lead operations platform for salon operators.</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent="center">
            <Chip label="Success" color="success" size="small" />
            <Chip label="Warning" color="warning" size="small" />
            <Chip label="Error" color="error" size="small" />
            <Chip label="Info" color="info" size="small" />
          </Stack>
          <Link href="/triage" style={{ textDecoration: "none" }}>
            <Button variant="contained" color="primary">
              Open Triage Queue
            </Button>
          </Link>
        </Stack>
      </main>
    </Box>
  );
}
