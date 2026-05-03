import { useEffect, useState } from "react"
import { collection, onSnapshot } from "firebase/firestore"
import { db } from "../firebase"
import {
  Box, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip,
  Card, CardContent, ToggleButton, ToggleButtonGroup,
  TextField, InputAdornment, Button, Pagination,
  useMediaQuery, useTheme
} from "@mui/material"
import SearchIcon from "@mui/icons-material/Search"
import TrendingUpIcon from "@mui/icons-material/TrendingUp"
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined"
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined"
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined"
import * as XLSX from "xlsx"

const tableHeadSx = {
  backgroundColor: "#f8fafc",
  "& .MuiTableCell-root": {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
    py: 1.5,
  },
}

const tableRowSx = {
  "&:hover": { backgroundColor: "#f8fafc" },
  "& .MuiTableCell-root": {
    borderBottom: "1px solid rgba(0,0,0,0.04)",
    fontSize: "0.875rem",
    color: "#0f172a",
  },
}

function GradientStatCard({ icon, iconBg, value, label }) {
  const colorKey =
    iconBg === "#f3f0ff" ? "purple" :
    iconBg === "#fffbeb" ? "amber" :
    "blue"

  const restGradients = {
    blue:   "linear-gradient(135deg, #eef5ff 0%, #f8fbff 100%)",
    purple: "linear-gradient(135deg, #f3f0ff 0%, #faf9ff 100%)",
    amber:  "linear-gradient(135deg, #fef9ec 0%, #fffdf7 100%)",
  }

  const borderColors = {
    blue:   "rgba(59,130,246,0.12)",
    purple: "rgba(139,92,246,0.12)",
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
        <Box
          sx={{
            width: 36, height: 36, borderRadius: "10px",
            backgroundColor: iconBg,
            display: "flex", alignItems: "center", justifyContent: "center",
            mb: 1.5,
            transition: "background-color 0.35s ease",
            ".MuiCard-root:hover &": { backgroundColor: "rgba(255,255,255,0.18)" },
          }}
        >
          <Box sx={{
            display: "flex", alignItems: "center",
            "& svg": { transition: "color 0.35s ease" },
            ".MuiCard-root:hover & svg": { color: "#fff !important" },
          }}>
            {icon}
          </Box>
        </Box>
        <Typography sx={{
          fontSize: { xs: "1.1rem", sm: "1.5rem" },
          fontWeight: 600, color: "#0f172a",
          mb: 0.5, letterSpacing: "-0.5px",
          transition: "color 0.35s ease",
          ".MuiCard-root:hover &": { color: "#fff" },
        }}>
          {value}
        </Typography>
        <Typography sx={{
          fontSize: { xs: "0.68rem", sm: "0.78rem" },
          color: "#94a3b8",
          transition: "color 0.35s ease",
          ".MuiCard-root:hover &": { color: "rgba(255,255,255,0.7)" },
        }}>
          {label}
        </Typography>
      </CardContent>
    </Card>
  )
}

const ROWS_PER_PAGE = 10

export default function Sales() {
  const [transactions, setTransactions] = useState([])
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

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

  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE)
  const paginated = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE)

  const handleFilter = (_, val) => { if (val) { setFilter(val); setPage(1) } }
  const handleSearch = (e) => { setSearch(e.target.value); setPage(1) }

  const salesOnly = transactions.filter((t) => t.type === "sell")
  const totalSales = salesOnly.reduce((sum, t) => sum + (t.total || 0), 0)
  const todaySales = salesOnly
    .filter((t) => t.timestamp && new Date(t.timestamp.seconds * 1000).toDateString() === todayStr)
    .reduce((sum, t) => sum + (t.total || 0), 0)
  const totalUnitsSold = salesOnly.reduce((sum, t) => sum + (t.qty || 0), 0)

  const fmt = (n) => `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`

  const handleExport = () => {
    const rows = [...transactions]
      .filter((t) => t.timestamp)
      .sort((a, b) => b.timestamp.seconds - a.timestamp.seconds)
      .map((t) => {
        const date = new Date(t.timestamp.seconds * 1000)
        return {
          Type: t.type === "sell" ? "Sale" : "Restock",
          Product: t.productName,
          Category: t.category,
          Qty: t.type === "sell" ? -t.qty : t.qty,
          "Price per Unit": t.pricePerUnit?.toFixed(2),
          Total: t.type === "sell" ? t.total?.toFixed(2) : "—",
          Date: date.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }),
          Time: date.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }),
        }
      })
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Transactions")
    XLSX.writeFile(wb, `sales-history-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const SUMMARY = [
    {
      label: "Today's Sales",
      value: fmt(todaySales),
      icon: <TrendingUpIcon sx={{ fontSize: 20, color: "#f59e0b" }} />,
      iconBg: "#fffbeb",
    },
    {
      label: "Overall Sales",
      value: fmt(totalSales),
      icon: <ReceiptLongOutlinedIcon sx={{ fontSize: 20, color: "#8b5cf6" }} />,
      iconBg: "#f3f0ff",
    },
    {
      label: "Total Units Sold",
      value: totalUnitsSold.toLocaleString(),
      icon: <Inventory2OutlinedIcon sx={{ fontSize: 20, color: "#3b82f6" }} />,
      iconBg: "#eff6ff",
    },
  ]

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
        <Typography variant="h5" sx={{ color: "#0f172a", mb: 0.5, fontWeight: 600, fontSize: { xs: "1.1rem", sm: "1.25rem" } }}>
          Sales History
        </Typography>
        <Typography variant="body2" sx={{ color: "#94a3b8", fontSize: "0.78rem" }}>
          Full log of all sales and restocks
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" },
          gap: { xs: 1.5, sm: 2.5 },
          mb: { xs: 2.5, sm: 4 },
        }}
      >
        {SUMMARY.map((card, i) => (
          <Box
            key={card.label}
            sx={{
              gridColumn: { xs: i === 0 ? "1 / -1" : "auto", sm: "auto" },
            }}
          >
            <GradientStatCard
              icon={card.icon}
              iconBg={card.iconBg}
              value={card.value}
              label={card.label}
            />
          </Box>
        ))}
      </Box>

      {/* Filters */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: { xs: 1.5, sm: 2 },
          mb: 2.5,
          alignItems: { xs: "stretch", sm: "center" },
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
          <ToggleButtonGroup
            value={filter}
            exclusive
            onChange={handleFilter}
            size="small"
            sx={{
              "& .MuiToggleButton-root": {
                textTransform: "none",
                fontSize: "0.8rem",
                fontWeight: 500,
                color: "#64748b",
                border: "1px solid rgba(0,0,0,0.1)",
                borderRadius: "8px !important",
                px: { xs: 1.5, sm: 2 },
                mx: 0.25,
                "&.Mui-selected": {
                  backgroundColor: "#1e3a5f",
                  color: "#fff",
                  "&:hover": { backgroundColor: "#3b82f6" },
                },
              },
            }}
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="sell">Sales</ToggleButton>
            <ToggleButton value="restock">Restocks</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <TextField
          placeholder="Search product..."
          value={search}
          onChange={handleSearch}
          size="small"
          sx={{
            width: { xs: "100%", sm: 240 },
            "& .MuiOutlinedInput-root": {
              borderRadius: "10px",
              fontSize: "0.875rem",
              "&:hover fieldset": { borderColor: "#3b82f6" },
              "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: "#94a3b8" }} />
              </InputAdornment>
            ),
          }}
        />

        <Button
          variant="outlined"
          startIcon={<FileDownloadOutlinedIcon />}
          onClick={handleExport}
          fullWidth={isMobile}
          sx={{
            ml: { xs: 0, sm: "auto" },
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 500,
            fontSize: "0.875rem",
            borderColor: "rgba(0,0,0,0.15)",
            color: "#64748b",
            "&:hover": { borderColor: "#3b82f6", color: "#3b82f6", backgroundColor: "#eff6ff" },
          }}
        >
          Export Excel
        </Button>
      </Box>

      {/* Table / Card List */}
      {filtered.length === 0 ? (
        <Card elevation={0} sx={{ border: "1px solid rgba(0,0,0,0.06)", borderRadius: "12px" }}>
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <Box component="img" src="https://i.imgur.com/3JP2Vfv.png" alt="No transactions"
              sx={{ width: 110, mb: 1.5, opacity: 0.1, display: "block", mx: "auto" }} />
            <Typography sx={{ fontWeight: 500, color: "#0f172a", mb: 0.5, fontSize: "0.95rem" }}>
              No transactions yet
            </Typography>
            <Typography sx={{ color: "#94a3b8", fontSize: "0.78rem" }}>
              Transactions will appear here once you start selling or restocking.
            </Typography>
          </CardContent>
        </Card>
      ) : isMobile ? (
        /* ── Mobile: card-based list ── */
        <>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {paginated.map((t) => {
              const date = new Date(t.timestamp.seconds * 1000)
              const isToday = date.toDateString() === todayStr
              const isSale = t.type === "sell"
              return (
                <Card
                  key={t.id}
                  elevation={0}
                  sx={{
                    border: "1px solid rgba(0,0,0,0.06)",
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}
                >
                  <CardContent sx={{ p: "14px !important" }}>
                    {/* Top row: type chip + category chip + date */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                      <Box sx={{ display: "flex", gap: 0.75, alignItems: "center", flexWrap: "wrap" }}>
                        <Chip
                          label={isSale ? "Sale" : "Restock"}
                          size="small"
                          sx={isSale
                            ? { backgroundColor: "#eff6ff", color: "#3b82f6", fontSize: "0.7rem", fontWeight: 500 }
                            : { backgroundColor: "#ecfdf5", color: "#10b981", fontSize: "0.7rem", fontWeight: 500 }}
                        />
                        <Chip
                          label={t.category}
                          size="small"
                          sx={{ backgroundColor: "#f8fafc", color: "#64748b", fontSize: "0.68rem", border: "1px solid rgba(0,0,0,0.06)" }}
                        />
                      </Box>
                      <Box sx={{ textAlign: "right" }}>
                        {isToday ? (
                          <Chip
                            label="Today"
                            size="small"
                            sx={{ backgroundColor: "#eff6ff", color: "#3b82f6", fontSize: "0.68rem", mr: 0.5 }}
                          />
                        ) : (
                          <Typography sx={{ fontSize: "0.72rem", color: "#64748b" }}>
                            {date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                          </Typography>
                        )}
                        <Typography sx={{ fontSize: "0.68rem", color: "#94a3b8" }}>
                          {date.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Product name only (category chip removed from here) */}
                    <Typography sx={{ fontSize: "0.9rem", fontWeight: 600, color: "#0f172a", mb: 1.25 }}>
                      {t.productName}
                    </Typography>

                    {/* Stats row */}
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box>
                        <Typography sx={{ fontSize: "0.68rem", color: "#94a3b8", mb: 0.25 }}>QTY</Typography>
                        <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: isSale ? "#ef4444" : "#10b981" }}>
                          {isSale ? `-${t.qty}` : `+${t.qty}`}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: "0.68rem", color: "#94a3b8", mb: 0.25 }}>PRICE</Typography>
                        <Typography sx={{ fontSize: "0.85rem", color: "#64748b" }}>
                          ₱{t.pricePerUnit?.toFixed(2)}
                        </Typography>
                      </Box>
                      <Box sx={{ ml: "auto", textAlign: "right" }}>
                        <Typography sx={{ fontSize: "0.68rem", color: "#94a3b8", mb: 0.25 }}>TOTAL</Typography>
                        <Typography sx={{ fontSize: "0.95rem", fontWeight: 700, color: isSale ? "#10b981" : "#94a3b8" }}>
                          {isSale ? `₱${t.total?.toFixed(2)}` : "—"}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              )
            })}
          </Box>

          {/* Pagination */}
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mt: 2.5, gap: 1 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, val) => setPage(val)}
              size="small"
              shape="rounded"
              siblingCount={0}
              sx={{
                "& .MuiPaginationItem-root": {
                  fontSize: "0.8rem", fontWeight: 500, color: "#64748b", borderRadius: "8px",
                  "&:hover": { backgroundColor: "#eff6ff", color: "#3b82f6" },
                  "&.Mui-selected": {
                    backgroundColor: "#1e3a5f", color: "#fff",
                    "&:hover": { backgroundColor: "#3b82f6" },
                  },
                },
              }}
            />
            <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8" }}>
              {Math.min((page - 1) * ROWS_PER_PAGE + 1, filtered.length)}–{Math.min(page * ROWS_PER_PAGE, filtered.length)} of {filtered.length}
            </Typography>
          </Box>
        </>
      ) : (
        /* ── Desktop: table ── */
        <>
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{ border: "1px solid rgba(0,0,0,0.06)", borderRadius: "12px", overflow: "hidden" }}
          >
            <Table>
              <TableHead sx={tableHeadSx}>
                <TableRow>
                  {["Type", "Product", "Category", "Qty", "Price", "Total", "Date & Time"].map((h) => (
                    <TableCell key={h}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.map((t) => {
                  const date = new Date(t.timestamp.seconds * 1000)
                  const isToday = date.toDateString() === todayStr
                  return (
                    <TableRow key={t.id} sx={tableRowSx}>
                      <TableCell>
                        <Chip
                          label={t.type === "sell" ? "Sale" : "Restock"}
                          size="small"
                          sx={t.type === "sell"
                            ? { backgroundColor: "#eff6ff", color: "#3b82f6", fontSize: "0.72rem", fontWeight: 500, border: "none" }
                            : { backgroundColor: "#ecfdf5", color: "#10b981", fontSize: "0.72rem", fontWeight: 500, border: "none" }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{t.productName}</TableCell>
                      <TableCell>
                        <Chip
                          label={t.category}
                          size="small"
                          sx={{ backgroundColor: "#f8fafc", color: "#64748b", fontSize: "0.72rem", border: "1px solid rgba(0,0,0,0.06)" }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: t.type === "sell" ? "#ef4444" : "#10b981", fontWeight: 500 }}>
                        {t.type === "sell" ? `-${t.qty}` : `+${t.qty}`}
                      </TableCell>
                      <TableCell sx={{ color: "#64748b" }}>₱{t.pricePerUnit?.toFixed(2)}</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: t.type === "sell" ? "#10b981" : "#94a3b8" }}>
                        {t.type === "sell" ? `₱${t.total?.toFixed(2)}` : "—"}
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: "0.85rem", fontWeight: 500, color: "#0f172a" }}>
                          {isToday ? (
                            <Chip
                              label="Today"
                              size="small"
                              sx={{ backgroundColor: "#eff6ff", color: "#3b82f6", fontSize: "0.7rem", mr: 0.5 }}
                            />
                          ) : (
                            date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
                          )}
                        </Typography>
                        <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                          {date.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 2.5 }}>
            <Typography sx={{ fontSize: "0.78rem", color: "#94a3b8" }}>
              Showing {Math.min((page - 1) * ROWS_PER_PAGE + 1, filtered.length)}–{Math.min(page * ROWS_PER_PAGE, filtered.length)} of {filtered.length} transactions
            </Typography>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, val) => setPage(val)}
              size="small"
              shape="rounded"
              sx={{
                "& .MuiPaginationItem-root": {
                  fontSize: "0.8rem", fontWeight: 500, color: "#64748b", borderRadius: "8px",
                  "&:hover": { backgroundColor: "#eff6ff", color: "#3b82f6" },
                  "&.Mui-selected": {
                    backgroundColor: "#1e3a5f", color: "#fff",
                    "&:hover": { backgroundColor: "#3b82f6" },
                  },
                },
              }}
            />
          </Box>
        </>
      )}
    </Box>
  )
}