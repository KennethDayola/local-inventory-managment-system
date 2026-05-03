import { useState } from "react"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "../firebase"
import {
  Box, Card, CardContent, Typography, TextField,
  Button, Alert, InputAdornment, IconButton
} from "@mui/material"
import StorefrontIcon from "@mui/icons-material/Storefront"
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined"
import LockOutlinedIcon from "@mui/icons-material/LockOutlined"
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined"
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined"

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    fontSize: "0.875rem",
    "& fieldset": { borderColor: "rgba(0,0,0,0.1)" },
    "&:hover fieldset": { borderColor: "rgba(59,130,246,0.4)" },
    "&.Mui-focused fieldset": { borderColor: "#3b82f6", borderWidth: "1.5px" },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: "#3b82f6" },
}

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch {
      setError("Invalid email or password. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#fafbff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: `
          radial-gradient(circle at 20% 20%, rgba(59,130,246,0.06) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(30,58,95,0.05) 0%, transparent 50%)
        `,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 400, px: 2 }}>
        {/* Logo + heading */}
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              background: "linear-gradient(135deg, #1e3a5f, #3b82f6)",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 1.5,
              boxShadow: "0 8px 24px rgba(59,130,246,0.3)",
            }}
          >
            <StorefrontIcon sx={{ color: "#fff", fontSize: 26 }} />
          </Box>
          <Typography sx={{ fontSize: "1.15rem", fontWeight: 600, color: "#0f172a", lineHeight: 1.2 }}>
            Sari-Sari Inventory
          </Typography>
          <Typography sx={{ fontSize: "0.78rem", color: "#94a3b8", mt: 0.4 }}>
            Sign in to your account
          </Typography>
        </Box>

        {/* Card */}
        <Card
          elevation={0}
          sx={{
            border: "1px solid rgba(0,0,0,0.07)",
            borderRadius: "18px",
            boxShadow: "0 4px 32px rgba(0,0,0,0.06)",
          }}
        >
          <CardContent sx={{ p: "28px !important" }}>
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ display: "flex", flexDirection: "column", gap: 2 }}
            >
              {error && (
                <Alert
                  severity="error"
                  sx={{
                    borderRadius: "10px",
                    fontSize: "0.8rem",
                    py: 0.5,
                    "& .MuiAlert-icon": { fontSize: 18 },
                  }}
                >
                  {error}
                </Alert>
              )}

              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
                size="small"
                autoComplete="email"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon sx={{ fontSize: 18, color: "#94a3b8" }} />
                    </InputAdornment>
                  ),
                }}
                sx={fieldSx}
              />

              <TextField
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                size="small"
                autoComplete="current-password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ fontSize: 18, color: "#94a3b8" }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowPassword((v) => !v)}
                        edge="end"
                        sx={{ color: "#94a3b8" }}
                      >
                        {showPassword
                          ? <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} />
                          : <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                        }
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={fieldSx}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{
                  mt: 0.5,
                  py: 1.1,
                  borderRadius: "10px",
                  textTransform: "none",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  background: "linear-gradient(135deg, #1e3a5f 0%, #3b82f6 100%)",
                  boxShadow: "0 4px 14px rgba(59,130,246,0.35)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
                    boxShadow: "0 6px 20px rgba(59,130,246,0.45)",
                  },
                  "&:disabled": { opacity: 0.7 },
                }}
              >
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Footer */}
        <Typography sx={{ textAlign: "center", mt: 2.5, fontSize: "0.72rem", color: "#cbd5e1" }}>
          For authorized personnel only
        </Typography>
      </Box>
    </Box>
  )
}