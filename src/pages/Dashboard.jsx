import { useEffect, useState } from "react"
import { collection, onSnapshot } from "firebase/firestore"
import { db } from "../firebase"
import {
  Box, Card, CardContent, Typography,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, useMediaQuery, useTheme
} from "@mui/material"
import TrendingUpIcon from "@mui/icons-material/TrendingUp"
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined"
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined"
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined"
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined"

function GradientStatCard({ icon, iconBg, value, label, danger }) {
  const colorKey = danger
    ? "red"
    : iconBg === "#f3f0ff"
    ? "purple"
    : iconBg === "#ecfdf5"
    ? "green"
    : iconBg === "#fffbeb"
    ? "amber"
    : "blue"

  const restGradients = {
    blue:   "linear-gradient(135deg, #f0f7ff 0%, #f8fbff 100%)",
    purple: "linear-gradient(135deg, #f5f3ff 0%, #faf9ff 100%)",
    green:  "linear-gradient(135deg, #f0fdf4 0%, #f7fef9 100%)",
    red:    "linear-gradient(135deg, #fff5f5 0%, #fffafa 100%)",
    amber:  "linear-gradient(135deg, #fef9ec 0%, #fffdf7 100%)",
  }

  const borderColors = {
    blue:   "rgba(59,130,246,0.12)",
    purple: "rgba(139,92,246,0.12)",
    green:  "rgba(16,185,129,0.12)",
    red:    "rgba(239,68,68,0.12)",
    amber:  "rgba(245,158,11,0.12)",
  }

  return (
    <Card
      elevation={0}
      sx={{
        position: "relative",
        overflow: "hidden",
        height: "100%",
        border: `1px solid ${borderColors[colorKey]}`,
        background: restGradients[colorKey],
        borderRadius: "18px",
        transition: "box-shadow 0.25s ease, border-color 0.25s ease, transform 0.25s ease",
        "&:hover": {
          transform: "translateY(-3px) scale(1.02)",
          boxShadow: "0 8px 28px rgba(59,130,246,0.2)",
          borderColor: "#3b82f6",
        },
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          background: "linear-gradient(135deg, #1e3a5f 0%, #3b82f6 100%)",
          opacity: 0,
          transition: "opacity 0.35s ease",
          zIndex: 0,
        },
        "&:hover::before": { opacity: 1 },
      }}
    >
      <CardContent sx={{ p: "16px !important", position: "relative", zIndex: 1 }}>
        <Box sx={{ mb: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              backgroundColor: iconBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background-color 0.35s ease",
              ".MuiCard-root:hover &": { backgroundColor: "rgba(255,255,255,0.18)" },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                "& svg": { transition: "color 0.35s ease" },
                ".MuiCard-root:hover & svg": { color: "#fff !important" },
              }}
            >
              {icon}
            </Box>
          </Box>
        </Box>

        <Typography
          sx={{
            fontSize: { xs: "1.1rem", sm: "1.6rem" },
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: "-0.5px",
            mb: 0.5,
            color: danger ? "#ef4444" : "#0f172a",
            transition: "color 0.35s ease",
            ".MuiCard-root:hover &": { color: "#fff" },
          }}
        >
          {value}
        </Typography>

        <Typography
          sx={{
            fontSize: { xs: "0.68rem", sm: "0.78rem" },
            fontWeight: 400,
            color: "#94a3b8",
            transition: "color 0.35s ease",
            ".MuiCard-root:hover &": { color: "rgba(255,255,255,0.7)" },
          }}
        >
          {label}
        </Typography>
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const [products, setProducts] = useState([])
  const [transactions, setTransactions] = useState([])
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

  useEffect(() => {
    const u1 = onSnapshot(collection(db, "products"), (s) =>
      setProducts(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    )
    const u2 = onSnapshot(collection(db, "transactions"), (s) =>
      setTransactions(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    )
    return () => { u1(); u2() }
  }, [])

  const todayStr = new Date().toDateString()
  const salesTxns = transactions.filter((t) => t.type === "sell")
  const totalSales = salesTxns.reduce((s, t) => s + (t.total || 0), 0)
  const todayTxns = salesTxns.filter(
    (t) => t.timestamp && new Date(t.timestamp.seconds * 1000).toDateString() === todayStr
  )
  const todaySales = todayTxns.reduce((s, t) => s + (t.total || 0), 0)
  const lowStock = products.filter((p) => p.stock <= p.lowStockThreshold)
  const inventoryValue = products.reduce((s, p) => s + p.price * p.stock, 0)

  const recentSales = [...salesTxns]
    .filter((t) => t.timestamp)
    .sort((a, b) => b.timestamp.seconds - a.timestamp.seconds)
    .slice(0, 8)

  const fmt = (n) => `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`

  const STATS = [
    {
      label: "Sales today",
      value: fmt(todaySales),
      icon: <TrendingUpIcon sx={{ fontSize: 20, color: "#f59e0b" }} />,
      iconBg: "#fffbeb",
    },
    {
      label: "Overall sales",
      value: fmt(totalSales),
      icon: <ReceiptLongOutlinedIcon sx={{ fontSize: 20, color: "#8b5cf6" }} />,
      iconBg: "#f3f0ff",
    },
    {
      label: "Inventory value",
      value: fmt(inventoryValue),
      icon: <PaidOutlinedIcon sx={{ fontSize: 20, color: "#10b981" }} />,
      iconBg: "#ecfdf5",
    },
    {
      label: "Total products",
      value: products.length,
      icon: <Inventory2OutlinedIcon sx={{ fontSize: 20, color: "#3b82f6" }} />,
      iconBg: "#eff6ff",
    },
    {
      label: "Low stock",
      value: lowStock.length,
      icon: <WarningAmberOutlinedIcon sx={{ fontSize: 20, color: lowStock.length > 0 ? "#ef4444" : "#10b981" }} />,
      iconBg: lowStock.length > 0 ? "#fef2f2" : "#ecfdf5",
      danger: lowStock.length > 0,
    },
  ]

  const panelCardSx = {
    transition: "box-shadow 0.25s ease, border-color 0.25s ease, transform 0.25s ease",
    "&:hover": {
      transform: "translateY(-3px) scale(1.015)",
      borderColor: "#3b82f6",
      boxShadow: "0 0 0 1px #3b82f6, 0 8px 28px rgba(59,130,246,0.14)",
    },
  }

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3.5 },
        pr: { xs: 2, sm: 13 },
        pb: { xs: "84px", sm: 3.5 },
        minHeight: "100vh",
        backgroundColor: "#fff",
      }}
    >
      {/* Header */}
      <Box sx={{ mb: { xs: 2.5, sm: 3.5 } }}>
        <Typography
          variant="h5"
          sx={{ color: "#0f172a", mb: 0.5, fontWeight: 600, fontSize: { xs: "1.1rem", sm: "1.25rem" } }}
        >
          Dashboard
        </Typography>
        <Typography variant="body2" sx={{ color: "#94a3b8", fontSize: "0.78rem" }}>
          {new Date().toLocaleDateString("en-PH", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
          })}
        </Typography>
      </Box>

      {/* Stat Cards — 2-col grid on mobile, 5-col on desktop */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(5, 1fr)" },
          gap: { xs: 1.5, sm: 2.5 },
          mb: { xs: 2.5, sm: 4 },
        }}
      >
        {STATS.map((card) => (
          <GradientStatCard
            key={card.label}
            icon={card.icon}
            iconBg={card.iconBg}
            value={card.value}
            label={card.label}
            danger={card.danger}
          />
        ))}
      </Box>

      {/* Bottom panels — stacked on mobile, side-by-side on desktop */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2.5,
          width: "100%",
          minHeight: { xs: "auto", sm: 400 },
        }}
      >
        {/* Recent Sales */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Card
            elevation={0}
            sx={{
              ...panelCardSx,
              height: "100%",
              border: "1px solid rgba(0,0,0,0.06)",
              borderRadius: "12px",
            }}
          >
            <CardContent sx={{ p: "20px !important" }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="h6" sx={{ fontSize: "0.95rem", color: "#0f172a" }}>
                  Recent sales
                </Typography>
                {todayTxns.length > 0 && (
                  <Chip
                    label={`${todayTxns.length} today`}
                    size="small"
                    sx={{ backgroundColor: "#eff6ff", color: "#3b82f6", fontSize: "0.7rem", fontWeight: 500 }}
                  />
                )}
              </Box>
              <Typography sx={{ fontSize: "0.78rem", color: "#94a3b8", mb: 2 }}>
                Latest transactions
              </Typography>

              {recentSales.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 5 }}>
                  <Box component="img" src="https://i.imgur.com/hg4TsKo.png" alt="No sales"
                    sx={{ width: 110, mb: 1.5, opacity: 0.1 }} />
                  <Typography variant="body2" color="text.secondary">No sales yet</Typography>
                </Box>
              ) : isMobile ? (
                /* Mobile: compact card rows */
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {recentSales.map((t) => {
                    const d = new Date(t.timestamp.seconds * 1000)
                    const isToday = d.toDateString() === todayStr
                    return (
                      <Box
                        key={t.id}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          p: 1.25,
                          borderRadius: "10px",
                          border: "1px solid rgba(0,0,0,0.05)",
                          backgroundColor: "#fafbfc",
                        }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
                          <Typography sx={{
                            fontSize: "0.82rem", fontWeight: 500, color: "#0f172a",
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          }}>
                            {t.productName}
                          </Typography>
                          <Typography sx={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                            {t.category} · qty {t.qty}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                          <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: "#10b981" }}>
                            {fmt(t.total)}
                          </Typography>
                          <Typography sx={{ fontSize: "0.68rem", color: "#94a3b8" }}>
                            {isToday
                              ? d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })
                              : d.toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                          </Typography>
                        </Box>
                      </Box>
                    )
                  })}
                </Box>
              ) : (
                <TableContainer component={Paper} elevation={0} sx={{ border: "none", boxShadow: "none", borderRadius: 0 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{
                        "& .MuiTableCell-root": {
                          fontSize: "0.72rem", fontWeight: 600, color: "#64748b",
                          textTransform: "uppercase", letterSpacing: "0.05em",
                          borderBottom: "1px solid rgba(0,0,0,0.06)", py: 1,
                        },
                      }}>
                        {["Product", "Qty", "Total", "Time"].map((h) => (
                          <TableCell key={h}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentSales.map((t) => {
                        const d = new Date(t.timestamp.seconds * 1000)
                        const isToday = d.toDateString() === todayStr
                        return (
                          <TableRow key={t.id} sx={{
                            cursor: "default",
                            "&:hover": { backgroundColor: "#f8fafc" },
                            "& .MuiTableCell-root": { borderBottom: "1px solid rgba(0,0,0,0.04)", fontSize: "0.875rem" },
                          }}>
                            <TableCell>
                              <Typography sx={{ fontSize: "0.85rem", fontWeight: 500, color: "#0f172a" }}>{t.productName}</Typography>
                              <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8" }}>{t.category}</Typography>
                            </TableCell>
                            <TableCell sx={{ fontSize: "0.85rem" }}>{t.qty}</TableCell>
                            <TableCell sx={{ fontWeight: 500, color: "#10b981", fontSize: "0.85rem" }}>{fmt(t.total)}</TableCell>
                            <TableCell>
                              <Chip
                                label={isToday
                                  ? d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })
                                  : d.toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                                size="small"
                                sx={isToday
                                  ? { backgroundColor: "#eff6ff", color: "#3b82f6", fontSize: "0.7rem" }
                                  : { fontSize: "0.7rem" }}
                              />
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Low Stock */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Card elevation={0} sx={{ ...panelCardSx, height: "100%", border: "1px solid rgba(0,0,0,0.06)", borderRadius: "12px" }}>
            <CardContent sx={{ p: "20px !important" }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="h6" sx={{ fontSize: "0.95rem", color: "#0f172a" }}>
                  Low stock alerts
                </Typography>
                {lowStock.length > 0 && (
                  <Chip label={lowStock.length} color="error" size="small" sx={{ fontSize: "0.7rem", fontWeight: 500 }} />
                )}
              </Box>
              <Typography sx={{ fontSize: "0.78rem", color: "#94a3b8", mb: 2 }}>
                Items needing restock
              </Typography>

              {lowStock.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 5 }}>
                  <Box component="img" src="https://i.imgur.com/hHpdKIl.png" alt="All stocked up"
                    sx={{ width: 110, mb: 1.5, opacity: 0.1 }} />
                  <Typography variant="body2" color="text.secondary">All stocked up!</Typography>
                </Box>
              ) : (
                lowStock.map((p, i) => (
                  <Box
                    key={p.id}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      py: 1.4,
                      borderBottom: i < lowStock.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none",
                      transition: "background 0.15s",
                      borderRadius: "8px",
                      px: 1,
                      mx: -1,
                      "&:hover": { backgroundColor: "#fef2f2" },
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
                      <Typography sx={{
                        fontSize: "0.85rem", fontWeight: 500, color: "#0f172a",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>
                        {p.name}
                      </Typography>
                      <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8" }}>{p.category}</Typography>
                    </Box>
                    <Chip
                      label={`${p.stock} left`}
                      size="small"
                      sx={{ backgroundColor: "#fef2f2", color: "#ef4444", fontSize: "0.7rem", fontWeight: 500, flexShrink: 0 }}
                    />
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  )
}