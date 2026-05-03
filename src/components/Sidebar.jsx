import { useState } from "react"
import {
  Box, Typography, useMediaQuery, useTheme,
  Dialog, DialogContent, DialogActions, Button
} from "@mui/material"
import { useNavigate, useLocation } from "react-router-dom"
import { signOut } from "firebase/auth"
import { auth } from "../firebase"
import StorefrontIcon from "@mui/icons-material/Storefront"
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined"
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined"
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined"
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined"
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined"

const NAV = [
  { icon: DashboardOutlinedIcon, label: "Dashboard", path: "/" },
  { icon: Inventory2OutlinedIcon, label: "Products", path: "/products" },
  { icon: ShoppingCartOutlinedIcon, label: "Restock/Sell", path: "/transactions" },
  { icon: ReceiptLongOutlinedIcon, label: "Sales", path: "/sales" },
]

function SignOutDialog({ open, onClose, onConfirm, isMobile }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        elevation: 0,
        sx: {
          border: "1px solid rgba(0,0,0,0.08)",
          ...(isMobile
            ? {
                position: "fixed",
                bottom: 0,
                top: "auto",
                m: 0,
                borderRadius: "20px 20px 0 0",
                width: "100%",
              }
            : { borderRadius: "16px" }),
        },
      }}
    >
      {/* Drag handle on mobile */}
      {isMobile && (
        <Box sx={{ display: "flex", justifyContent: "center", pt: 1.5, pb: 0.5 }}>
          <Box sx={{ width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(0,0,0,0.12)" }} />
        </Box>
      )}

      <DialogContent sx={{ pt: isMobile ? "16px !important" : "28px !important", pb: 1, px: 3, textAlign: "center" }}>
        {/* Icon */}
        <Box
          sx={{
            width: 48, height: 48, borderRadius: "14px",
            background: "linear-gradient(135deg, #1e3a5f, #3b82f6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            mx: "auto", mb: 2,
            boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
          }}
        >
          <LogoutOutlinedIcon sx={{ color: "#fff", fontSize: 22 }} />
        </Box>
        <Typography sx={{ fontWeight: 600, fontSize: "1rem", color: "#0f172a", mb: 0.75 }}>
          Sign out?
        </Typography>
        <Typography sx={{ fontSize: "0.85rem", color: "#64748b", lineHeight: 1.5 }}>
          You'll need to sign in again to access the inventory system.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: isMobile ? 3 : 2.5, pt: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          fullWidth
          sx={{
            textTransform: "none",
            color: "#64748b",
            borderRadius: "10px",
            border: "1px solid rgba(0,0,0,0.12)",
            "&:hover": { backgroundColor: "#f8fafc" },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          fullWidth
          sx={{
            textTransform: "none",
            fontWeight: 500,
            borderRadius: "10px",
            backgroundColor: "#1e3a5f",
            boxShadow: "none",
            "&:hover": {
              backgroundColor: "#3b82f6",
              boxShadow: "0 4px 14px rgba(59,130,246,0.35)",
            },
          }}
        >
          Sign out
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default function Sidebar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const [signOutOpen, setSignOutOpen] = useState(false)

  const handleConfirmSignOut = async () => {
    setSignOutOpen(false)
    await signOut(auth)
  }

  /* ── Mobile: fixed bottom nav bar ── */
  if (isMobile) {
    return (
      <>
        <Box
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 200,
            backgroundColor: "#fff",
            borderTop: "1px solid rgba(0,0,0,0.07)",
            boxShadow: "0 -4px 20px rgba(0,0,0,0.06)",
            display: "flex",
            alignItems: "center",
            height: 64,
            px: 1,
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          {NAV.map((item) => {
            const active = pathname === item.path
            const Icon = item.icon
            return (
              <Box
                key={item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.5,
                  py: 0.75,
                  cursor: "pointer",
                  borderRadius: "10px",
                  mx: 0.25,
                  color: active ? "#3b82f6" : "#94a3b8",
                  backgroundColor: active ? "#eff6ff" : "transparent",
                  transition: "all 0.15s ease",
                  "&:active": { transform: "scale(0.93)" },
                }}
              >
                <Box
                  sx={{
                    width: 4, height: 4, borderRadius: "50%",
                    backgroundColor: active ? "#3b82f6" : "transparent",
                    mb: 0.25,
                    transition: "background-color 0.15s ease",
                  }}
                />
                <Icon sx={{ fontSize: 22 }} />
                <Typography sx={{ fontSize: "0.62rem", fontWeight: active ? 600 : 400, color: "inherit", lineHeight: 1, whiteSpace: "nowrap" }}>
                  {item.label}
                </Typography>
              </Box>
            )
          })}

          {/* Sign out button */}
          <Box
            onClick={() => setSignOutOpen(true)}
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.5,
              py: 0.75,
              cursor: "pointer",
              borderRadius: "10px",
              mx: 0.25,
              color: "#94a3b8",
              transition: "all 0.15s ease",
              "&:active": { transform: "scale(0.93)", color: "#ef4444" },
            }}
          >
            <Box sx={{ width: 4, height: 4, borderRadius: "50%", mb: 0.25 }} />
            <LogoutOutlinedIcon sx={{ fontSize: 22 }} />
            <Typography sx={{ fontSize: "0.62rem", fontWeight: 400, color: "inherit", lineHeight: 1 }}>
              Sign out
            </Typography>
          </Box>
        </Box>

        <SignOutDialog
          open={signOutOpen}
          onClose={() => setSignOutOpen(false)}
          onConfirm={handleConfirmSignOut}
          isMobile={isMobile}
        />
      </>
    )
  }

  /* ── Desktop: sidebar ── */
  return (
    <>
      <Box
        sx={{
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
        }}
      >
        {/* Logo */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1, mb: 3.5 }}>
          <Box
            sx={{
              width: 36, height: 36,
              background: "linear-gradient(135deg, #1e3a5f, #3b82f6)",
              borderRadius: "10px",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
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
            const Icon = item.icon
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
                  transition: "all 0.15s ease",
                  "&:hover": {
                    backgroundColor: active ? "#eff6ff" : "#f4f6fb",
                    color: active ? "#3b82f6" : "#0f172a",
                  },
                }}
              >
                <Icon sx={{ fontSize: 18 }} />
                <Typography sx={{ fontSize: "0.85rem", fontWeight: active ? 500 : 400, color: "inherit", lineHeight: 1 }}>
                  {item.label}
                </Typography>
                {active && (
                  <Box sx={{ ml: "auto", width: 4, height: 4, borderRadius: "50%", backgroundColor: "#3b82f6" }} />
                )}
              </Box>
            )
          })}
        </Box>

        {/* Sign out */}
        <Box
          onClick={() => setSignOutOpen(true)}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 1.5,
            py: 1.1,
            borderRadius: "10px",
            cursor: "pointer",
            color: "#94a3b8",
            transition: "all 0.15s ease",
            "&:hover": { backgroundColor: "#fff5f5", color: "#ef4444" },
          }}
        >
          <LogoutOutlinedIcon sx={{ fontSize: 18 }} />
          <Typography sx={{ fontSize: "0.85rem", color: "inherit", lineHeight: 1 }}>
            Sign out
          </Typography>
        </Box>
      </Box>

      <SignOutDialog
        open={signOutOpen}
        onClose={() => setSignOutOpen(false)}
        onConfirm={handleConfirmSignOut}
        isMobile={isMobile}
      />
    </>
  )
}