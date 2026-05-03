import { useEffect, useState } from "react"
import { collection, onSnapshot } from "firebase/firestore"
import { db } from "../firebase"
import {
  Box, Grid, Card, CardContent, Typography,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Avatar
} from "@mui/material"
import InventoryIcon from "@mui/icons-material/Inventory2"
import WarningAmberIcon from "@mui/icons-material/WarningAmber"
import PaidIcon from "@mui/icons-material/Paid"
import TodayIcon from "@mui/icons-material/Today"
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong"

export default function Dashboard() {
  const [products, setProducts] = useState([])
  const [transactions, setTransactions] = useState([])

  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, "products"), (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    const unsub2 = onSnapshot(collection(db, "transactions"), (snap) => {
      setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => { unsub1(); unsub2() }
  }, [])

  const totalProducts = products.length
  const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0)
  const lowStock = products.filter((p) => p.stock <= p.lowStockThreshold)

  // Sales calculations
  const salesTxns = transactions.filter((t) => t.type === "sell")
  const totalSales = salesTxns.reduce((sum, t) => sum + (t.total || 0), 0)

  const todayStr = new Date().toDateString()
  const todayTxns = salesTxns.filter((t) => {
    if (!t.timestamp) return false
    return new Date(t.timestamp.seconds * 1000).toDateString() === todayStr
  })
  const todaySales = todayTxns.reduce((sum, t) => sum + (t.total || 0), 0)

  // Recent sales (last 8 sell transactions, newest first)
  const recentSales = [...salesTxns]
    .filter((t) => t.timestamp)
    .sort((a, b) => b.timestamp.seconds - a.timestamp.seconds)
    .slice(0, 8)

  const statCards = [
    {
      label: "Total Products",
      value: totalProducts,
      icon: <InventoryIcon />,
      bg: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    },
    {
      label: "Inventory Value",
      value: `₱${totalValue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
      icon: <PaidIcon />,
      bg: "linear-gradient(135deg, #10b981, #059669)",
    },
    {
      label: "Today's Sales",
      value: `₱${todaySales.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
      icon: <TodayIcon />,
      bg: todaySales > 0
        ? "linear-gradient(135deg, #f59e0b, #d97706)"
        : "linear-gradient(135deg, #94a3b8, #64748b)",
    },
    {
      label: "Overall Sales",
      value: `₱${totalSales.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
      icon: <ReceiptLongIcon />,
      bg: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
    },
    {
      label: "Low Stock Items",
      value: lowStock.length,
      icon: <WarningAmberIcon />,
      bg: lowStock.length > 0
        ? "linear-gradient(135deg, #ef4444, #dc2626)"
        : "linear-gradient(135deg, #10b981, #059669)",
    },
  ]

  return (
    <Box sx={{ p: 3, maxWidth: 1100, mx: "auto" }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5">Dashboard</Typography>
        <Typography variant="body2" color="text.secondary">
          Overview of your store inventory and sales
        </Typography>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={2} mb={4}>
        {statCards.map((card) => (
          <Grid item xs={12} sm={6} md={4} key={card.label}>
            <Card elevation={0}>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, p: 2.5 }}>
                <Avatar
                  sx={{
                    background: card.bg,
                    width: 52,
                    height: 52,
                    borderRadius: "14px",
                  }}
                >
                  {card.icon}
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    {card.label}
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {card.value}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Sales */}
      <Box sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="h6">Recent Sales</Typography>
        {todayTxns.length > 0 && (
          <Chip label={`${todayTxns.length} today`} color="warning" size="small" />
        )}
      </Box>

      {recentSales.length === 0 ? (
        <Card elevation={0} sx={{ mb: 4 }}>
          <CardContent sx={{ textAlign: "center", py: 5 }}>
            <Typography fontSize={32} mb={1}>🛒</Typography>
            <Typography fontWeight={600}>No sales yet</Typography>
            <Typography variant="body2" color="text.secondary">
              Sales will appear here once you start selling products.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                {["Product", "Category", "Qty", "Price", "Total", "Time"].map((h) => (
                  <TableCell key={h}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {recentSales.map((t) => {
                const date = new Date(t.timestamp.seconds * 1000)
                const isToday = date.toDateString() === todayStr
                return (
                  <TableRow key={t.id}>
                    <TableCell sx={{ fontWeight: 500 }}>{t.productName}</TableCell>
                    <TableCell>
                      <Chip label={t.category} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{t.qty}</TableCell>
                    <TableCell>₱{t.pricePerUnit?.toFixed(2)}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "#10b981" }}>
                      ₱{t.total?.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={isToday
                          ? date.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })
                          : date.toLocaleDateString("en-PH", { month: "short", day: "numeric" })
                        }
                        size="small"
                        color={isToday ? "primary" : "default"}
                        variant={isToday ? "filled" : "outlined"}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Low Stock Alerts */}
      <Box sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="h6">Low Stock Alerts</Typography>
        {lowStock.length > 0 && (
          <Chip label={lowStock.length} color="error" size="small" />
        )}
      </Box>

      {lowStock.length === 0 ? (
        <Card elevation={0}>
          <CardContent sx={{ textAlign: "center", py: 5 }}>
            <Typography fontSize={32} mb={1}>✅</Typography>
            <Typography fontWeight={600}>All stocked up!</Typography>
            <Typography variant="body2" color="text.secondary">
              No items are running low right now.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead>
              <TableRow>
                {["Product", "Category", "Price", "Stock", "Threshold"].map((h) => (
                  <TableCell key={h}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {lowStock.map((p) => (
                <TableRow key={p.id}>
                  <TableCell sx={{ fontWeight: 500 }}>{p.name}</TableCell>
                  <TableCell>
                    <Chip label={p.category} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>₱{p.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip label={p.stock} color="error" size="small" />
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>{p.lowStockThreshold}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}