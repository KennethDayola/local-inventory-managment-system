import { Box, Typography, Tooltip } from "@mui/material"
import { useNavigate, useLocation } from "react-router-dom"
import StorefrontIcon from "@mui/icons-material/Storefront"
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined"
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined"
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined"
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined"
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined"

const NAV = [
  { icon: <DashboardOutlinedIcon sx={{ fontSize: 18 }} />, label: "Dashboard", path: "/" },
  { icon: <Inventory2OutlinedIcon sx={{ fontSize: 18 }} />, label: "Products", path: "/products" },
  { icon: <ShoppingCartOutlinedIcon sx={{ fontSize: 18 }} />, label: "Restock / Sell", path: "/transactions" },
  { icon: <ReceiptLongOutlinedIcon sx={{ fontSize: 18 }} />, label: "Sales History", path: "/sales" },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <Box sx={{
      width: 210,
      minHeight: "100vh",
      backgroundColor: "#fff",
      borderRight: "1px solid rgba(0,0,0,0.06)",
      display: "flex",
      flexDirection: "column",
      px: 1.5,
      py: 2.5,
      position: "fixed",
      top: 0,
      left: 0,
      zIndex: 100,
      boxShadow: "2px 0 12px rgba(0,0,0,0.03)",
    }}>
      {/* Logo */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1, mb: 3.5 }}>
        <Box sx={{
          width: 36, height: 36,
          background: "linear-gradient(135deg, #1e3a5f, #3b82f6)",
          borderRadius: "10px",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <StorefrontIcon sx={{ color: "#fff", fontSize: 18 }} />
        </Box>
        <Box>
          <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, lineHeight: 1.2, color: "#0f172a" }}>
            Sari-Sari
          </Typography>
          <Typography sx={{ fontSize: "0.7rem", color: "#94a3b8", lineHeight: 1 }}>
            Inventory System
          </Typography>
        </Box>
      </Box>

      {/* Nav */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, flex: 1 }}>
        {NAV.map((item) => {
          const active = pathname === item.path
          return (
            <Box
              key={item.path}
              onClick={() => navigate(item.path)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 1.5,
                py: 1.1,
                borderRadius: "10px",
                cursor: "pointer",
                color: active ? "#3b82f6" : "#64748b",
                backgroundColor: active ? "#eff6ff" : "transparent",
                fontWeight: active ? 500 : 400,
                transition: "all 0.15s ease",
                "&:hover": {
                  backgroundColor: active ? "#eff6ff" : "#f4f6fb",
                  color: active ? "#3b82f6" : "#0f172a",
                },
              }}
            >
              {item.icon}
              <Typography sx={{
                fontSize: "0.85rem",
                fontWeight: active ? 500 : 400,
                color: "inherit",
                lineHeight: 1,
              }}>
                {item.label}
              </Typography>
              {active && (
                <Box sx={{
                  ml: "auto",
                  width: 4, height: 4,
                  borderRadius: "50%",
                  backgroundColor: "#3b82f6",
                }} />
              )}
            </Box>
          )
        })}
      </Box>

     
    </Box>
  )
}