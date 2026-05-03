import { AppBar, Toolbar, Typography, Box, Button } from "@mui/material"
import { useNavigate, useLocation } from "react-router-dom"
import StorefrontIcon from "@mui/icons-material/Storefront"

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { label: "Dashboard", path: "/" },
    { label: "Products", path: "/products" },
    { label: "Restock / Sell", path: "/transactions" },
    { label: "Sales History", path: "/sales" },
  ]

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Toolbar sx={{ px: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexGrow: 1 }}>
          <Box
            sx={{
              backgroundColor: "#3b82f6",
              borderRadius: "10px",
              p: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <StorefrontIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight="700" lineHeight={1.2}>
              Sari-Sari Store
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", lineHeight: 1 }}>
              Inventory System
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          {navItems.map((item) => {
            const active = location.pathname === item.path
            return (
              <Button
                key={item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  color: active ? "#fff" : "rgba(255,255,255,0.55)",
                  backgroundColor: active ? "rgba(59,130,246,0.2)" : "transparent",
                  border: active ? "1px solid rgba(59,130,246,0.4)" : "1px solid transparent",
                  borderRadius: "8px",
                  px: 2,
                  py: 0.8,
                  fontSize: "0.8rem",
                  fontWeight: active ? 600 : 400,
                  textTransform: "none",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.08)",
                    color: "#fff",
                  },
                }}
              >
                {item.label}
              </Button>
            )
          })}
        </Box>
      </Toolbar>
    </AppBar>
  )
}