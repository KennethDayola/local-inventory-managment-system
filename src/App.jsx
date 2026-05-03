import { useEffect, useState } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { ThemeProvider, CssBaseline, Box, CircularProgress, useMediaQuery, useTheme } from "@mui/material"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "./firebase"
import theme from "./theme"
import Sidebar from "./components/Sidebar"
import Dashboard from "./pages/Dashboard"
import Products from "./pages/Products"
import Transactions from "./pages/Transactions"
import Sales from "./pages/Sales"
import Login from "./pages/Login"

function AppLayout() {
  const muiTheme = useTheme()
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"))

  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar />
      <Box
        sx={{
          // On mobile: no left margin (sidebar is hidden), add bottom padding for bottom nav
          ml: isMobile ? 0 : "210px",
          flex: 1,
          minHeight: "100vh",
          backgroundColor: "#fafbff",
        }}
      >
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
    </Box>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setChecking(false)
    })
    return unsub
  }, [])

  if (checking) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#fafbff",
          }}
        >
          <CircularProgress size={32} sx={{ color: "#3b82f6" }} />
        </Box>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={user ? <Navigate to="/" replace /> : <Login />}
          />
          <Route
            path="/*"
            element={user ? <AppLayout /> : <Navigate to="/login" replace />}
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}