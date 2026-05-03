import { useEffect, useState } from "react"
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore"
import { db } from "../firebase"
import {
  Box, Button, Typography, TextField, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Select, FormControl, InputLabel, Chip,
  IconButton, Card, InputAdornment
} from "@mui/material"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import AddIcon from "@mui/icons-material/Add"
import SearchIcon from "@mui/icons-material/Search"

const CATEGORIES = [
  "Beverages", "Snacks", "Noodles", "Condiments",
  "Canned Goods", "Personal Care", "Household", "Others"
]

const EMPTY_FORM = {
  name: "", category: "Beverages", price: "", stock: "", lowStockThreshold: "5"
}

export default function Products() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [errors, setErrors] = useState({})

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
    <Box sx={{ p: 3, maxWidth: 1100, mx: "auto" }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5">Products</Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your store items
        </Typography>
      </Box>

      {/* Top Bar */}
      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <TextField
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ width: 280 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Add Product
        </Button>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} elevation={0}>
        <Table>
          <TableHead>
            <TableRow>
              {["Name", "Category", "Price", "Stock", "Low Stock At", "Actions"].map((h) => (
                <TableCell key={h}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id}>
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
                  <TableCell sx={{ color: "text.secondary" }}>{p.lowStockThreshold}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpen(p)} color="primary" sx={{ mr: 0.5 }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(p.id, p.name)} color="error">
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
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          {editId ? "Edit Product" : "Add Product"}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "12px !important" }}>
          <TextField
            label="Product Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={!!errors.name}
            helperText={errors.name}
            fullWidth size="small"
          />
          <FormControl fullWidth size="small">
            <InputLabel>Category</InputLabel>
            <Select
              value={form.category}
              label="Category"
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField
            label="Price (₱)"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            error={!!errors.price}
            helperText={errors.price}
            fullWidth size="small"
          />
          <TextField
            label="Stock Quantity"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            error={!!errors.stock}
            helperText={errors.stock}
            fullWidth size="small"
          />
          <TextField
            label="Low Stock Alert At"
            value={form.lowStockThreshold}
            onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
            error={!!errors.lowStockThreshold}
            helperText={errors.lowStockThreshold}
            fullWidth size="small"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setOpen(false)} variant="outlined" color="inherit">
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
