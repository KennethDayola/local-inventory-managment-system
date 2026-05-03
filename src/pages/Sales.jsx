import { useEffect, useState } from "react"
import { collection, onSnapshot } from "firebase/firestore"
import { db } from "../firebase"
import {
  Box, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip,
  Card, CardContent, ToggleButton, ToggleButtonGroup,
  TextField, InputAdornment
} from "@mui/material"
import SearchIcon from "@mui/icons-material/Search"

export default function Sales() {
  const [transactions, setTransactions] = useState([])
  const [filter, setFilter] = useState("all") // "all" | "sell" | "restock"
  const [search, setSearch] = useState("")

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "transactions"), (snap) => {
      setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  const todayStr = new Date().toDateString()

  const sorted = [...transactions]
    .filter((t) => t.timestamp)
    .sort((a, b) => b.timestamp.seconds - a.timestamp.seconds)

  const filtered = sorted.filter((t) => {
    const matchesType = filter === "all" || t.type === filter
    const matchesSearch =
      t.productName?.toLowerCase().includes(search.toLowerCase()) ||
      t.category?.toLowerCase().includes(search.toLowerCase())
    return matchesType && matchesSearch
  })

  const salesOnly = transactions.filter((t) => t.type === "sell")
  const totalSales = salesOnly.reduce((sum, t) => sum + (t.total || 0), 0)
  const todaySales = salesOnly
    .filter((t) => t.timestamp && new Date(t.timestamp.seconds * 1000).toDateString() === todayStr)
    .reduce((sum, t) => sum + (t.total || 0), 0)
  const totalUnitsSold = salesOnly.reduce((sum, t) => sum + (t.qty || 0), 0)

  return (
    <Box sx={{ p: 3, maxWidth: 1100, mx: "auto" }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5">Sales History</Typography>
        <Typography variant="body2" color="text.secondary">
          Full log of all sales and restocks
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <Card elevation={0} sx={{ flex: 1, minWidth: 160 }}>
          <CardContent sx={{ p: "16px !important" }}>
            <Typography variant="body2" color="text.secondary">Today's Sales</Typography>
            <Typography variant="h6" fontWeight={700} color="#f59e0b">
              ₱{todaySales.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ flex: 1, minWidth: 160 }}>
          <CardContent sx={{ p: "16px !important" }}>
            <Typography variant="body2" color="text.secondary">Overall Sales</Typography>
            <Typography variant="h6" fontWeight={700} color="#8b5cf6">
              ₱{totalSales.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ flex: 1, minWidth: 160 }}>
          <CardContent sx={{ p: "16px !important" }}>
            <Typography variant="body2" color="text.secondary">Total Units Sold</Typography>
            <Typography variant="h6" fontWeight={700} color="#3b82f6">
              {totalUnitsSold.toLocaleString()}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Filters */}
      <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center", flexWrap: "wrap" }}>
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={(_, val) => { if (val) setFilter(val) }}
          size="small"
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="sell">Sales</ToggleButton>
          <ToggleButton value="restock">Restocks</ToggleButton>
        </ToggleButtonGroup>

        <TextField
          placeholder="Search product..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ width: 240 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card elevation={0}>
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <Typography fontSize={32} mb={1}>📋</Typography>
            <Typography fontWeight={600}>No transactions yet</Typography>
            <Typography variant="body2" color="text.secondary">
              Transactions will appear here once you start selling or restocking.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead>
              <TableRow>
                {["Type", "Product", "Category", "Qty", "Price", "Total", "Date & Time"].map((h) => (
                  <TableCell key={h}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((t) => {
                const date = new Date(t.timestamp.seconds * 1000)
                const isToday = date.toDateString() === todayStr
                return (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Chip
                        label={t.type === "sell" ? "Sale" : "Restock"}
                        color={t.type === "sell" ? "primary" : "success"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{t.productName}</TableCell>
                    <TableCell>
                      <Chip label={t.category} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{t.type === "sell" ? `-${t.qty}` : `+${t.qty}`}</TableCell>
                    <TableCell>₱{t.pricePerUnit?.toFixed(2)}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: t.type === "sell" ? "#10b981" : "#94a3b8" }}>
                      {t.type === "sell" ? `₱${t.total?.toFixed(2)}` : "—"}
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {isToday ? "Today" : date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {date.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}