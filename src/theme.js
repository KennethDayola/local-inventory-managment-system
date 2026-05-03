import { createTheme } from "@mui/material"

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#3b82f6" },
    secondary: { main: "#8b5cf6" },
    background: { default: "#ffffff", paper: "#ffffff" },
    success: { main: "#10b981" },
    error: { main: "#ef4444" },
    warning: { main: "#f59e0b" },
  },
  typography: {
    fontFamily: "'Inter', 'DM Sans', 'Segoe UI', sans-serif",
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 600,
    h5: { fontWeight: 600, letterSpacing: "-0.3px" }, // lighter — was 600
    h6: { fontWeight: 600, letterSpacing: "-0.2px" },
    subtitle1: { fontWeight: 500 },
    body1: { fontWeight: 400 },
    body2: { fontWeight: 400, color: "#64748b" },
    caption: { fontWeight: 400 },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { background: #ffffff; }
      `,
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          border: "1px solid rgba(0,0,0,0.05)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          transition: "box-shadow 0.2s ease, transform 0.2s ease",
          "&:hover": {
            boxShadow: "0 8px 28px rgba(0,0,0,0.09)",
            transform: "translateY(-2px)",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: "none",
          fontWeight: 500,
          fontSize: "0.875rem",
          boxShadow: "none",
          "&:hover": { boxShadow: "none" },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 10,
            backgroundColor: "#f8fafc",
            fontSize: "0.875rem",
          },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          border: "1px solid rgba(0,0,0,0.05)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-head": {
            backgroundColor: "#f8fafc",
            fontWeight: 500,
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "#94a3b8",
            borderBottom: "1px solid rgba(0,0,0,0.05)",
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: "background 0.15s",
          "&:hover": { backgroundColor: "#f0f7ff" },
          "&:last-child td": { borderBottom: 0 },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: "0.875rem",
          borderBottom: "1px solid rgba(0,0,0,0.04)",
          padding: "14px 16px",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 500, fontSize: "0.72rem" },
      },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 20 } },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 12 } },
    },
  },
})

export default theme