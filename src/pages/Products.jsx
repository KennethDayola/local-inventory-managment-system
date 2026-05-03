import { useEffect, useState, useRef } from "react"
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs } from "firebase/firestore"
import { db } from "../firebase"
import {
  Box, Button, Typography, TextField, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Select, FormControl, InputLabel, Chip,
  IconButton, InputAdornment, Tooltip, CircularProgress, Snackbar, Alert
} from "@mui/material"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import AddIcon from "@mui/icons-material/Add"
import SearchIcon from "@mui/icons-material/Search"
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined"
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"
import * as XLSX from "xlsx"

const CATEGORIES = [
  "Beverages", "Snacks", "Noodles", "Condiments",
  "Canned Goods", "Personal Care", "Household", "Others"
]

const EMPTY_FORM = {
  name: "", category: "Beverages", price: "", stock: "", lowStockThreshold: "5"
}

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

export default function Products() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [errors, setErrors] = useState({})
  const [importing, setImporting] = useState(false)
  const [snack, setSnack] = useState(null)
  const fileInputRef = useRef(null)

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!fileInputRef.current) return
    fileInputRef.current.value = ""
    if (!file) return
    setImporting(true)
    try {
      const data = await file.arrayBuffer()
      const wb = XLSX.read(data)
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws)

      let added = 0, updated = 0, skipped = 0
      for (const row of rows) {
        const name = String(row["Name"] || row["name"] || "").trim()
        if (!name) { skipped++; continue }
        const category = String(row["Category"] || row["category"] || "Others").trim()
        const price = parseFloat(row["Price"] || row["price"] || 0)
        const stock = parseInt(row["Stock"] || row["stock"] || 0)
        const lowStockThreshold = parseInt(row["Low Stock Threshold"] || row["lowStockThreshold"] || 5)

        const q = query(collection(db, "products"), where("name", "==", name))
        const snap = await getDocs(q)
        if (!snap.empty) {
          await updateDoc(doc(db, "products", snap.docs[0].id), { name, category, price, stock, lowStockThreshold })
          updated++
        } else {
          await addDoc(collection(db, "products"), { name, category, price, stock, lowStockThreshold })
          added++
        }
      }
      setSnack({ severity: "success", msg: `Import done: ${added} added, ${updated} updated${skipped ? `, ${skipped} skipped` : ""}.` })
    } catch {
      setSnack({ severity: "error", msg: "Failed to read file. Make sure it's a valid .xlsx file." })
    }
    setImporting(false)
  }

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

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = "Name is required"
    if (!form.price || isNaN(form.price) || Number(form.price) < 0) e.price = "Enter a valid price"
    if (!form.stock || isNaN(form.stock) || !Number.isInteger(Number(form.stock))) e.stock = "Enter a valid stock"
    if (!form.lowStockThreshold || isNaN(form.lowStockThreshold)) e.lowStockThreshold = "Enter a valid threshold"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleOpen = (product = null) => {
    if (product) {
      setForm({
        name: product.name,
        category: product.category,
        price: String(product.price),
        stock: String(product.stock),
        lowStockThreshold: String(product.lowStockThreshold),
      })
      setEditId(product.id)
    } else {
      setForm(EMPTY_FORM)
      setEditId(null)
    }
    setErrors({})
    setOpen(true)
  }

  const handleSave = async () => {
    if (!validate()) return
    const data = {
      name: form.name.trim(),
      category: form.category,
      price: parseFloat(form.price),
      stock: parseInt(form.stock),
      lowStockThreshold: parseInt(form.lowStockThreshold),
    }
    if (editId) {
      await updateDoc(doc(db, "products", editId), data)
    } else {
      await addDoc(collection(db, "products"), data)
    }
    setOpen(false)
  }

  const handleDelete = async (id, name) => {
    if (window.confirm(`Delete "${name}"?`)) {
      await deleteDoc(doc(db, "products", id))
    }
  }

  return (
    <Box sx={{ p: 3.5, pr: 13, minHeight: "100vh", backgroundColor: "#fff" }}>
      {/* Header */}
      <Box sx={{ mb: 3.5 }}>
        <Typography variant="h5" sx={{ color: "#0f172a", mb: 0.5, fontWeight: 500 }}>
          Products
        </Typography>
        <Typography variant="body2" sx={{ color: "#94a3b8" }}>
          Manage your store items
        </Typography>
      </Box>

      {/* Top Bar */}
      <Box sx={{ display: "flex", gap: 2, mb: 2.5, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{
            width: 280,
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
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
          sx={{
            backgroundColor: "#1e3a5f",
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 500,
            fontSize: "0.875rem",
            boxShadow: "none",
            "&:hover": {
              backgroundColor: "#3b82f6",
              boxShadow: "0 4px 14px rgba(59,130,246,0.35)",
            },
          }}
        >
          Add Product
        </Button>

        {/* Import Excel */}
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={handleImport} />
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Button
            variant="outlined"
            startIcon={importing ? <CircularProgress size={14} /> : <FileUploadOutlinedIcon />}
            disabled={importing}
            onClick={() => fileInputRef.current?.click()}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 500,
              fontSize: "0.875rem",
              borderColor: "rgba(0,0,0,0.15)",
              color: "#64748b",
              "&:hover": { borderColor: "#3b82f6", color: "#3b82f6", backgroundColor: "#eff6ff" },
            }}
          >
            {importing ? "Importing..." : "Import Excel"}
          </Button>
          <Tooltip
            arrow
            placement="right"
            title={
              <Box sx={{ p: 0.5, fontSize: "0.78rem", lineHeight: 1.8 }}>
                <Typography sx={{ fontWeight: 600, fontSize: "0.8rem", mb: 0.5 }}>Excel format required:</Typography>
                <Box component="ul" sx={{ m: 0, pl: 2 }}>
                  <li><b>Name</b> — product name (required)</li>
                  <li><b>Category</b> — e.g. Beverages</li>
                  <li><b>Price</b> — number (e.g. 25.50)</li>
                  <li><b>Stock</b> — whole number</li>
                  <li><b>Low Stock Threshold</b> — whole number</li>
                </Box>
                <Typography sx={{ mt: 0.5, fontSize: "0.75rem", color: "rgba(255,255,255,0.7)" }}>
                  ⚠ Existing products with the same name will be overwritten.
                </Typography>
              </Box>
            }
          >
            <InfoOutlinedIcon sx={{ fontSize: 18, color: "#94a3b8", cursor: "pointer", "&:hover": { color: "#3b82f6" } }} />
          </Tooltip>
        </Box>
      </Box>

      {/* Table */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: "1px solid rgba(0,0,0,0.06)", borderRadius: "12px", overflow: "hidden" }}
      >
        <Table>
          <TableHead sx={tableHeadSx}>
            <TableRow>
              {["Name", "Category", "Price", "Stock", "Low Stock At", "Actions"].map((h) => (
                <TableCell key={h}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <Box component="img" src="https://i.imgur.com/LdImzVA.png" alt="No products" sx={{ width: 110, mb: 1.5, opacity: 0.1 }} />
                    <Typography sx={{ color: "#94a3b8", fontSize: "0.875rem" }}>No products found.</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id} sx={tableRowSx}>
                  <TableCell sx={{ fontWeight: 500 }}>{p.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={p.category}
                      size="small"
                      sx={{
                        backgroundColor: "#eff6ff",
                        color: "#3b82f6",
                        fontSize: "0.72rem",
                        fontWeight: 500,
                        border: "none",
                      }}
                    />
                  </TableCell>
                  <TableCell>₱{p.price.toFixed(2)}</TableCell>
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
                  <TableCell sx={{ color: "#94a3b8" }}>{p.lowStockThreshold}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleOpen(p)}
                      sx={{
                        mr: 0.5,
                        color: "#3b82f6",
                        "&:hover": { backgroundColor: "#eff6ff" },
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(p.id, p.name)}
                      sx={{
                        color: "#ef4444",
                        "&:hover": { backgroundColor: "#fef2f2" },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          elevation: 0,
          sx: {
            borderRadius: "16px",
            border: "1px solid rgba(0,0,0,0.08)",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: "#0f172a", pb: 1, fontSize: "1rem" }}>
          {editId ? "Edit Product" : "Add Product"}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "12px !important" }}>
          <TextField
            label="Product Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={!!errors.name}
            helperText={errors.name}
            fullWidth
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                "&:hover fieldset": { borderColor: "#3b82f6" },
                "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
              },
              "& .MuiInputLabel-root.Mui-focused": { color: "#3b82f6" },
            }}
          />
          <FormControl fullWidth size="small">
            <InputLabel sx={{ "&.Mui-focused": { color: "#3b82f6" } }}>Category</InputLabel>
            <Select
              value={form.category}
              label="Category"
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              MenuProps={{ disablePortal: false, style: { zIndex: 9999 } }}
              sx={{
                borderRadius: "10px",
                "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#3b82f6" },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#3b82f6" },
              }}
            >
              {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </Select>
          </FormControl>
          {[
            { label: "Price (₱)", key: "price" },
            { label: "Stock Quantity", key: "stock" },
            { label: "Low Stock Alert At", key: "lowStockThreshold" },
          ].map(({ label, key }) => (
            <TextField
              key={key}
              label={label}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              error={!!errors[key]}
              helperText={errors[key]}
              fullWidth
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px",
                  "&:hover fieldset": { borderColor: "#3b82f6" },
                  "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                },
                "& .MuiInputLabel-root.Mui-focused": { color: "#3b82f6" },
              }}
            />
          ))}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setOpen(false)}
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
            onClick={handleSave}
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
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snack?.severity} onClose={() => setSnack(null)} sx={{ borderRadius: "10px" }}>
          {snack?.msg}
        </Alert>
      </Snackbar>
    </Box>
  )
}