import { useEffect, useState } from "react"
import { collection, onSnapshot, updateDoc, doc, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase"
import {
  Box, Typography, TextField, OutlinedInput, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Button,
  Chip, Alert, Card, CardContent, InputAdornment, IconButton
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import RemoveIcon from "@mui/icons-material/Remove"
import SearchIcon from "@mui/icons-material/Search"

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

export default function Transactions() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState(null)
  const [qty, setQty] = useState("1")
  const [status, setStatus] = useState(null)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  )

  const selected = products.find((p) => p.id === selectedId)

  const showStatus = (msg, severity) => {
    setStatus({ msg, severity })
    setTimeout(() => setStatus(null), 3000)
  }

  const handleRestock = async () => {
    if (!selected) return showStatus("Select a product first.", "warning")
    const q = parseInt(qty)
    if (!q || q <= 0) return showStatus("Enter a valid quantity.", "warning")

    await updateDoc(doc(db, "products", selected.id), { stock: selected.stock + q })
    await addDoc(collection(db, "transactions"), {
      type: "restock",
      productId: selected.id,
      productName: selected.name,
      category: selected.category,
      qty: q,
      pricePerUnit: selected.price,
      total: 0,
      timestamp: serverTimestamp(),
    })

    showStatus(`Restocked +${q} units for "${selected.name}"!`, "success")
  }

  const handleSell = async () => {
    if (!selected) return showStatus("Select a product first.", "warning")
    const q = parseInt(qty)
    if (!q || q <= 0) return showStatus("Enter a valid quantity.", "warning")
    if (q > selected.stock) return showStatus(`Not enough stock! Only ${selected.stock} left.`, "error")

    await updateDoc(doc(db, "products", selected.id), { stock: selected.stock - q })
    await addDoc(collection(db, "transactions"), {
      type: "sell",
      productId: selected.id,
      productName: selected.name,
      category: selected.category,
      qty: q,
      pricePerUnit: selected.price,
      total: selected.price * q,
      timestamp: serverTimestamp(),
    })

    showStatus(`Sold -${q} units of "${selected.name}"!`, "info")
  }

  return (
    <Box sx={{ p: 3.5, pr: 13, minHeight: "100vh", backgroundColor: "#fff" }}>
      {/* Header */}
      <Box sx={{ mb: 3.5 }}>
        <Typography variant="h5" sx={{ color: "#0f172a", mb: 0.5, fontWeight: 500 }}>
          Restock / Sell
        </Typography>
        <Typography variant="body2" sx={{ color: "#94a3b8" }}>
          Select a product then restock or sell
        </Typography>
      </Box>

      {/* Status Alert */}
      {status && (
        <Alert
          severity={status.severity}
          onClose={() => setStatus(null)}
          sx={{
            mb: 2.5,
            borderRadius: "10px",
            fontSize: "0.875rem",
            border: "1px solid",
            borderColor:
              status.severity === "success" ? "rgba(16,185,129,0.2)"
              : status.severity === "error" ? "rgba(239,68,68,0.2)"
              : "rgba(59,130,246,0.2)",
          }}
        >
          {status.msg}
        </Alert>
      )}

      {/* Selected Product Banner */}
      {selected ? (
        <Card
          elevation={0}
          sx={{
            mb: 2.5,
            border: "1px solid #3b82f6",
            borderRadius: "12px",
            backgroundColor: "#eff6ff",
          }}
        >
          <CardContent sx={{ py: "14px !important", px: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box>
              <Typography sx={{ fontWeight: 600, color: "#0f172a", fontSize: "0.95rem" }}>
                {selected.name}
              </Typography>
              <Typography sx={{ fontSize: "0.78rem", color: "#64748b" }}>
                {selected.category} · ₱{selected.price.toFixed(2)}
              </Typography>
            </Box>
            <Chip
              label={`${selected.stock} in stock`}
              size="small"
              sx={
                selected.stock <= selected.lowStockThreshold
                  ? { backgroundColor: "#fef2f2", color: "#ef4444", fontWeight: 600, border: "none" }
                  : { backgroundColor: "#ecfdf5", color: "#10b981", fontWeight: 600, border: "none" }
              }
            />
          </CardContent>
        </Card>
      ) : (
        <Card
          elevation={0}
          sx={{
            mb: 2.5,
            backgroundColor: "#f8fafc",
            border: "1px dashed #cbd5e1",
            borderRadius: "12px",
          }}
        >
          <CardContent sx={{ textAlign: "center", py: "16px !important" }}>
            <Typography sx={{ fontSize: "0.875rem", color: "#94a3b8" }}>
              Click a product below to select it
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Action Bar */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3, flexWrap: "wrap" }}>
        {/* Quantity stepper */}
        <Box sx={{
          display: "flex", alignItems: "center",
          border: "1px solid #cbd5e1", borderRadius: "10px", overflow: "hidden", height: 40,
          width: "fit-content",
        }}>
          <IconButton
            size="small"
            onClick={() => setQty((v) => String(Math.max(1, parseInt(v) || 1) - 1))}
            sx={{ borderRadius: 0, px: 1.2, height: "100%", "&:hover": { backgroundColor: "#f1f5f9" }, borderRight: "1px solid #cbd5e1" }}
          >
            <RemoveIcon sx={{ fontSize: 16, color: "#64748b" }} />
          </IconButton>
          <OutlinedInput
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            inputProps={{ style: { textAlign: "center", padding: "0", fontSize: "0.875rem", fontWeight: 500, width: 36 } }}
            sx={{
              height: 40,
              width: 60,
              borderRadius: 0,
              backgroundColor: "transparent",
              "& fieldset": { border: "none" },
            }}
          />
          <IconButton
            size="small"
            onClick={() => setQty((v) => String((parseInt(v) || 0) + 1))}
            sx={{ borderRadius: 0, px: 1.2, height: "100%", "&:hover": { backgroundColor: "#f1f5f9" }, borderLeft: "1px solid #cbd5e1" }}
          >
            <AddIcon sx={{ fontSize: 16, color: "#64748b" }} />
          </IconButton>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleRestock}
          sx={{
            backgroundColor: "#10b981",
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 500,
            fontSize: "0.875rem",
            boxShadow: "none",
            "&:hover": { backgroundColor: "#059669", boxShadow: "0 4px 14px rgba(16,185,129,0.35)" },
          }}
        >
          Restock
        </Button>
        <Button
          variant="contained"
          startIcon={<RemoveIcon />}
          onClick={handleSell}
          sx={{
            backgroundColor: "#1e3a5f",
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 500,
            fontSize: "0.875rem",
            boxShadow: "none",
            "&:hover": { backgroundColor: "#3b82f6", boxShadow: "0 4px 14px rgba(59,130,246,0.35)" },
          }}
        >
          Sell
        </Button>
      </Box>

      {/* Search */}
      <TextField
        placeholder="Search product..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        size="small"
        sx={{
          width: 280,
          mb: 2,
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

      {/* Table */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: "1px solid rgba(0,0,0,0.06)", borderRadius: "12px", overflow: "hidden" }}
      >
        <Table>
          <TableHead sx={tableHeadSx}>
            <TableRow>
              {["", "Name", "Category", "Price", "Stock"].map((h) => (
                <TableCell key={h}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                  <Box component="img" src="https://i.imgur.com/LdImzVA.png" alt="No products" sx={{ width: 110, mb: 1.5, opacity: 0.1, display: "block", mx: "auto" }} />
                  <Typography sx={{ color: "#94a3b8", fontSize: "0.875rem" }}>No products found.</Typography>
                </TableCell>
              </TableRow>
            ) : filtered.map((p) => {
              const isSelected = selectedId === p.id
              return (
                <TableRow
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  sx={{
                    cursor: "pointer",
                    backgroundColor: isSelected ? "#eff6ff !important" : "inherit",
                    outline: isSelected ? "1px solid #3b82f6" : "none",
                    "&:hover": { backgroundColor: isSelected ? "#eff6ff" : "#f8fafc" },
                    "& .MuiTableCell-root": {
                      borderBottom: "1px solid rgba(0,0,0,0.04)",
                      fontSize: "0.875rem",
                      color: "#0f172a",
                    },
                  }}
                >
                  <TableCell padding="checkbox" sx={{ pl: 2 }}>
                    <Box
                      sx={{
                        width: 10, height: 10, borderRadius: "50%",
                        backgroundColor: isSelected ? "#3b82f6" : "#e2e8f0",
                        border: isSelected ? "2px solid #93c5fd" : "2px solid #cbd5e1",
                        transition: "all 0.2s ease",
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{p.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={p.category}
                      size="small"
                      sx={{ backgroundColor: "#eff6ff", color: "#3b82f6", fontSize: "0.72rem", fontWeight: 500, border: "none" }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: "#64748b" }}>₱{p.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip
                      label={p.stock}
                      size="small"
                      sx={{
                        backgroundColor: p.stock <= p.lowStockThreshold ? "#fef2f2" : "#ecfdf5",
                        color: p.stock <= p.lowStockThreshold ? "#ef4444" : "#10b981",
                        fontWeight: 600,
                        fontSize: "0.72rem",
                        border: "none",
                      }}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}