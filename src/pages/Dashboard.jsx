import { useEffect, useState } from "react"
import { collection, onSnapshot } from "firebase/firestore"
import { db } from "../firebase"
import {
  Box, Card, CardContent, Typography,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip
} from "@mui/material"
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined"
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined"
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined"
import TodayOutlinedIcon from "@mui/icons-material/TodayOutlined"
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined"

function GradientStatCard({ icon, iconBg, value, label, danger }) {
  const colorKey = danger
    ? "red"
    : iconBg === "#f3f0ff"
    ? "purple"
    : iconBg === "#ecfdf5"
    ? "green"
    : "blue"

  const restGradients = {
    blue:   "linear-gradient(135deg, #f0f7ff 0%, #f8fbff 100%)",
    purple: "linear-gradient(135deg, #f5f3ff 0%, #faf9ff 100%)",
    green:  "linear-gradient(135deg, #f0fdf4 0%, #f7fef9 100%)",
    red:    "linear-gradient(135deg, #fff5f5 0%, #fffafa 100%)",
  }

  const borderColors = {
    blue:   "rgba(59,130,246,0.12)",
    purple: "rgba(139,92,246,0.12)",
    green:  "rgba(16,185,129,0.12)",
    red:    "rgba(239,68,68,0.12)",
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
        // Dark blue gradient overlay on hover
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
        "&:hover::before": {
          opacity: 1,
        },
      }}
    >
      <CardContent sx={{ p: "20px !important", position: "relative", zIndex: 1 }}>
        <Box sx={{ mb: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
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
            fontSize: "1.6rem",
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
            fontSize: "0.78rem",
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
      icon: <TodayOutlinedIcon sx={{ fontSize: 22, color: "#3b82f6" }} />,
      iconBg: "#eff6ff",
    },
    {
      label: "Overall sales",
      value: fmt(totalSales),
      icon: <ReceiptLongOutlinedIcon sx={{ fontSize: 22, color: "#8b5cf6" }} />,
      iconBg: "#f3f0ff",
    },
    {
      label: "Inventory value",
      value: fmt(inventoryValue),
      icon: <PaidOutlinedIcon sx={{ fontSize: 22, color: "#10b981" }} />,
      iconBg: "#ecfdf5",
    },
    {
      label: "Total products",
      value: products.length,
      icon: <Inventory2OutlinedIcon sx={{ fontSize: 22, color: "#3b82f6" }} />,
      iconBg: "#eff6ff",
    },
    {
      label: "Low stock",
      value: lowStock.length,
      icon: <WarningAmberOutlinedIcon sx={{ fontSize: 22, color: lowStock.length > 0 ? "#ef4444" : "#10b981" }} />,
      iconBg: lowStock.length > 0 ? "#fef2f2" : "#ecfdf5",
      danger: lowStock.length > 0,
    },
  ]

  const panelCardSx = {
    minWidth: 220,
    transition: "box-shadow 0.25s ease, border-color 0.25s ease, transform 0.25s ease",
    "&:hover": {
      transform: "translateY(-3px) scale(1.015)",
      borderColor: "#3b82f6",
      boxShadow: "0 0 0 1px #3b82f6, 0 8px 28px rgba(59,130,246,0.14)",
    },
  }

  return (
    <Box sx={{ p: 3.5, pr: 13, minHeight: "100vh", backgroundColor: "#fff" }}>
      {/* Header */}
      <Box sx={{ mb: 3.5 }}>
        <Typography variant="h5" sx={{ color: "#0f172a", mb: 0.5, fontWeight: 500 }}>
          Dashboard
        </Typography>
        <Typography variant="body2" sx={{ color: "#94a3b8" }}>
          {new Date().toLocaleDateString("en-PH", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
          })}
        </Typography>
      </Box>

      {/* Stat Cards */}
      <Box sx={{ display: "flex", gap: 2.5, mb: 4, width: "100%" }}>
        {STATS.map((card) => (
          <Box key={card.label} sx={{ flex: 1, minWidth: 0 }}>
            <GradientStatCard
              icon={card.icon}
              iconBg={card.iconBg}
              value={card.value}
              label={card.label}
              danger={card.danger}
            />
          </Box>
        ))}
      </Box>

      {/* Bottom panels */}
      <Box sx={{ display: "flex", gap: 2.5, width: "100%", minHeight: 400 }}>
        {/* Recent Sales */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Card elevation={0} sx={{ ...panelCardSx, height: "100%" }}>
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
              <Typography sx={{ fontSize: "0.78rem", color: "#94a3b8", mb: 2.5 }}>
                Latest transactions
              </Typography>

              {recentSales.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 5 }}>
                  <Box component="img" src="https://i.imgur.com/hg4TsKo.png" alt="No sales" sx={{ width: 110, mb: 1.5, opacity: 0.1 }} />
                  <Typography variant="body2" color="text.secondary">No sales yet</Typography>
                </Box>
              ) : (
                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{ border: "none", boxShadow: "none", borderRadius: 0 }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow>
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
                          <TableRow key={t.id} sx={{ cursor: "default" }}>
                            <TableCell>
                              <Typography sx={{ fontSize: "0.85rem", fontWeight: 500, color: "#0f172a" }}>
                                {t.productName}
                              </Typography>
                              <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                                {t.category}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ fontSize: "0.85rem" }}>{t.qty}</TableCell>
                            <TableCell sx={{ fontWeight: 500, color: "#10b981", fontSize: "0.85rem" }}>
                              {fmt(t.total)}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={
                                  isToday
                                    ? d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })
                                    : d.toLocaleDateString("en-PH", { month: "short", day: "numeric" })
                                }
                                size="small"
                                sx={
                                  isToday
                                    ? { backgroundColor: "#eff6ff", color: "#3b82f6", fontSize: "0.7rem" }
                                    : { fontSize: "0.7rem" }
                                }
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
          <Card elevation={0} sx={{ ...panelCardSx, height: "100%" }}>
            <CardContent sx={{ p: "20px !important" }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="h6" sx={{ fontSize: "0.95rem", color: "#0f172a" }}>
                  Low stock alerts
                </Typography>
                {lowStock.length > 0 && (
                  <Chip
                    label={lowStock.length}
                    color="error"
                    size="small"
                    sx={{ fontSize: "0.7rem", fontWeight: 500 }}
                  />
                )}
              </Box>
              <Typography sx={{ fontSize: "0.78rem", color: "#94a3b8", mb: 2.5 }}>
                Items needing restock
              </Typography>

              {lowStock.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 5 }}>
                  <Box component="img" src="https://i.imgur.com/hHpdKIl.png" alt="All stocked up" sx={{ width: 110, mb: 1.5, opacity: 0.1 }} />
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
                    <Box>
                      <Typography sx={{ fontSize: "0.85rem", fontWeight: 500, color: "#0f172a" }}>
                        {p.name}
                      </Typography>
                      <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                        {p.category}
                      </Typography>
                    </Box>
                    <Chip
                      label={`${p.stock} left`}
                      size="small"
                      sx={{ backgroundColor: "#fef2f2", color: "#ef4444", fontSize: "0.7rem", fontWeight: 500 }}
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