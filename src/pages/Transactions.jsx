import { useEffect, useState } from "react"
import { collection, onSnapshot, updateDoc, doc, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase"
import {
  Box, Typography, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Button,
  Chip, Alert, Card, CardContent, InputAdornment
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import RemoveIcon from "@mui/icons-material/Remove"
import SearchIcon from "@mui/icons-material/Search"

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
    <Box sx={{ p: 3, maxWidth: 1100, mx: "auto" }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5">Restock / Sell</Typography>
        <Typography variant="body2" color="text.secondary">
          Select a product then restock or sell
        </Typography>
      </Box>

      {status && (
        <Alert severity={status.severity} sx={{ mb: 2 }} onClose={() => setStatus(null)}>
          {status.msg}
        </Alert>
      )}

      {selected ? (
        <Card elevation={0} sx={{ mb: 2, border: "1px solid", borderColor: "primary.main", backgroundColor: "#eff6ff" }}>
          <CardContent sx={{ py: "12px !important", px: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box>
              <Typography fontWeight={700}>{selected.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {selected.category} · ₱{selected.price.toFixed(2)}
              </Typography>
            </Box>
            <Chip
              label={`${selected.stock} in stock`}
              color={selected.stock <= selected.lowStockThreshold ? "error" : "success"}
            />
          </CardContent>
        </Card>
      ) : (
        <Card elevation={0} sx={{ mb: 2, backgroundColor: "#f8fafc", border: "1px dashed #cbd5e1" }}>
          <CardContent sx={{ textAlign: "center", py: "16px !important" }}>
            <Typography variant="body2" color="text.secondary">
              Click a product below to select it
            </Typography>
          </CardContent>
        </Card>
      )}

      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <TextField
          label="Quantity"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          size="small"
          sx={{ width: 110 }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleRestock}
          sx={{ backgroundColor: "#10b981", "&:hover": { backgroundColor: "#059669" } }}
        >
          Restock
        </Button>
        <Button
          variant="contained"
          startIcon={<RemoveIcon />}
          onClick={handleSell}
        >
          Sell
        </Button>
      </Box>

      <TextField
        placeholder="Search product..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        size="small"
        sx={{ width: 280, mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
            </InputAdornment>
          ),
        }}
      />

      <TableContainer component={Paper} elevation={0}>
        <Table>
          <TableHead>
            <TableRow>
              {["", "Name", "Category", "Price", "Stock"].map((h) => (
                <TableCell key={h}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((p) => {
              const isSelected = selectedId === p.id
              return (
                <TableRow
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  sx={{
                    cursor: "pointer",
                    backgroundColor: isSelected ? "#eff6ff !important" : "inherit",
                    outline: isSelected ? "1px solid #3b82f6" : "none",
                  }}
                >
                  <TableCell padding="checkbox" sx={{ pl: 2 }}>
                    <Box
                      sx={{
                        width: 10, height: 10, borderRadius: "50%",
                        backgroundColor: isSelected ? "#3b82f6" : "#e2e8f0",
                        border: isSelected ? "2px solid #93c5fd" : "2px solid #cbd5e1",
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{p.name}</TableCell>
                  <TableCell>
                    <Chip label={p.category} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>₱{p.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip
                      label={p.stock}
                      color={p.stock <= p.lowStockThreshold ? "error" : "success"}
                      size="small"
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