import { createTheme } from "@mui/material/styles";

// Primitive colors mirrored in src/styles/abstracts/_variables.scss — the
// two can't share a single source without extra build tooling, so keep them
// in sync by hand when a token changes.
export const tokens = {
  primary: "#2454e5",
  primaryDark: "#1b3fbf",
  primaryLight: "#eaf0fe",
  bgSubtle: "#f6f7fb",
  border: "#e5e7eb",
  text: "#111827",
  textSecondary: "#6b7280",
};

// All visual styling for MUI components is expressed here, as global
// `styleOverrides` — components never use the `sx` prop; one-off layout
// lives in the 7-1 SCSS structure under src/styles instead.
const theme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: tokens.bgSubtle,
      paper: "#ffffff",
    },
    primary: {
      main: tokens.primary,
      dark: tokens.primaryDark,
      light: tokens.primaryLight,
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#111827",
      contrastText: "#ffffff",
    },
    text: {
      primary: tokens.text,
      secondary: tokens.textSecondary,
    },
    success: { main: "#16a34a" },
    error: { main: "#dc2626" },
    warning: { main: "#d97706" },
    info: { main: "#2563eb" },
    divider: tokens.border,
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: "'Inter', -apple-system, 'Segoe UI', sans-serif",
    h1: { fontWeight: 800 },
    h2: { fontWeight: 800 },
    h3: { fontWeight: 800 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: {
      fontWeight: 600,
      textTransform: "none",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: tokens.bgSubtle,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "none",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          paddingInline: 18,
        },
        containedPrimary: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
            backgroundColor: tokens.primaryDark,
          },
        },
        outlined: {
          borderColor: tokens.border,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
      defaultProps: {
        elevation: 0,
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          border: `1px solid ${tokens.border}`,
          boxShadow: "none",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 700,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
        notchedOutline: {
          borderColor: tokens.border,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: tokens.border,
        },
      },
    },
  },
});

export default theme;
