import { createTheme } from "@mui/material/styles";
import {
  PALETTE_PRIMARY,
  PALETTE_ACCENT,
  PALETTE_SURFACE,
  PALETTE_TEXT,
  PALETTE_SUCCESS_MAIN,
  PALETTE_WARNING_MAIN,
  PALETTE_ERROR_MAIN,
  PALETTE_INFO_MAIN,
  SPACING_BASE_PX,
  BREAKPOINT_KEYS,
  TYPOGRAPHY_HEADING_FONT_FAMILY,
  TYPOGRAPHY_BODY_FONT_FAMILY,
} from "./tokens";

const theme = createTheme({
  palette: {
    primary: { main: PALETTE_PRIMARY },
    secondary: { main: PALETTE_ACCENT },
    background: { default: PALETTE_SURFACE, paper: PALETTE_SURFACE },
    text: { primary: PALETTE_TEXT },
    success: { main: PALETTE_SUCCESS_MAIN },
    warning: { main: PALETTE_WARNING_MAIN },
    error: { main: PALETTE_ERROR_MAIN },
    info: { main: PALETTE_INFO_MAIN },
  },
  spacing: SPACING_BASE_PX,
  breakpoints: {
    values: BREAKPOINT_KEYS,
  },
  typography: {
    fontFamily: TYPOGRAPHY_BODY_FONT_FAMILY,
    h1: { fontFamily: TYPOGRAPHY_HEADING_FONT_FAMILY },
    h2: { fontFamily: TYPOGRAPHY_HEADING_FONT_FAMILY },
    h3: { fontFamily: TYPOGRAPHY_HEADING_FONT_FAMILY },
    h4: { fontFamily: TYPOGRAPHY_HEADING_FONT_FAMILY },
    h5: { fontFamily: TYPOGRAPHY_HEADING_FONT_FAMILY },
    h6: { fontFamily: TYPOGRAPHY_HEADING_FONT_FAMILY },
    subtitle1: { fontFamily: TYPOGRAPHY_BODY_FONT_FAMILY },
    subtitle2: { fontFamily: TYPOGRAPHY_BODY_FONT_FAMILY },
    body1: { fontFamily: TYPOGRAPHY_BODY_FONT_FAMILY },
    body2: { fontFamily: TYPOGRAPHY_BODY_FONT_FAMILY },
    button: { fontFamily: TYPOGRAPHY_BODY_FONT_FAMILY },
    caption: { fontFamily: TYPOGRAPHY_BODY_FONT_FAMILY },
  },
});

export default theme;
