import { useEffect, useState, useRef } from "react"
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs } from "firebase/firestore"
import { db } from "../firebase"
import {
  Box, Button, Typography, TextField, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Select, FormControl, InputLabel, Chip,
  IconButton, InputAdornment, CircularProgress, Snackbar, Alert,
  useMediaQuery, useTheme
} from "@mui/material"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import AddIcon from "@mui/icons-material/Add"
import SearchIcon from "@mui/icons-material/Search"
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined"
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded"
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

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    "&:hover fieldset": { borderColor: "#3b82f6" },
    "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: "#3b82f6" },
}

// Reusable bottom-sheet style dialog paper
function sheetPaper(isMobile) {
  return {
    elevation: 0,
    sx: {
      borderRadius: isMobile ? 0 : "16px",
      border: isMobile ? "none" : "1px solid rgba(0,0,0,0.08)",
      ...(isMobile && {
        position: "fixed",
        bottom: 0,
        top: "auto",
        m: 0,
        borderRadius: "20px 20px 0 0",
        maxHeight: "92vh",
        width: "100%",
      }),
    },
  }
}

function DragHandle() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", pt: 1.5, pb: 0.5 }}>
      <Box sx={{ width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(0,0,0,0.12)" }} />
    </Box>
  )
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

  // Delete confirm dialog
  const [deleteTarget, setDeleteTarget] = useState(null) // { id, name }

  // Info dialog (mobile tooltip replacement)
  const [infoOpen, setInfoOpen] = useState(false)

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

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

  const confirmDelete = async () => {
    if (!deleteTarget) return
    await deleteDoc(doc(db, "products", deleteTarget.id))
    setDeleteTarget(null)
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
      <Box sx={{ mb: { xs: 2, sm: 3.5 } }}>
        <Typography
          variant="h5"
          sx={{ color: "#0f172a", mb: 0.5, fontWeight: 500, fontSize: { xs: "1.1rem", sm: "1.25rem" } }}
        >
          Products
        </Typography>
        <Typography variant="body2" sx={{ color: "#94a3b8", fontSize: "0.78rem" }}>
          Manage your store items
        </Typography>
      </Box>

      {/* ── Top Bar: 2 rows on mobile, 1 row on desktop ── */}
      {isMobile ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, mb: 2.5 }}>
          {/* Row 1: Search */}
          <TextField
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            fullWidth
            sx={{
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

          {/* Row 2: Add + Import + Info */}
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpen()}
              sx={{
                flex: 1,
                backgroundColor: "#1e3a5f",
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 500,
                fontSize: "0.875rem",
                boxShadow: "none",
                "&:hover": { backgroundColor: "#3b82f6", boxShadow: "0 4px 14px rgba(59,130,246,0.35)" },
              }}
            >
              Add Product
            </Button>

            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={handleImport} />
            <Button
              variant="outlined"
              startIcon={importing ? <CircularProgress size={14} /> : <FileUploadOutlinedIcon />}
              disabled={importing}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                flex: 1,
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 500,
                fontSize: "0.875rem",
                borderColor: "rgba(0,0,0,0.15)",
                color: "#64748b",
                "&:hover": { borderColor: "#3b82f6", color: "#3b82f6", backgroundColor: "#eff6ff" },
              }}
            >
              {importing ? "Importing..." : "Import"}
            </Button>

            {/* Info button — opens dialog on mobile instead of hover tooltip */}
            <IconButton
              onClick={() => setInfoOpen(true)}
              size="small"
              sx={{
                color: "#94a3b8",
                border: "1px solid rgba(0,0,0,0.12)",
                borderRadius: "10px",
                width: 38,
                height: 38,
                "&:active": { backgroundColor: "#eff6ff", color: "#3b82f6" },
              }}
            >
              <InfoOutlinedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>
      ) : (
        /* Desktop: single row unchanged */
        <Box sx={{ display: "flex", gap: 2, mb: 2.5, alignItems: "center" }}>
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
              "&:hover": { backgroundColor: "#3b82f6", boxShadow: "0 4px 14px rgba(59,130,246,0.35)" },
            }}
          >
            Add Product
          </Button>
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
            <IconButton onClick={() => setInfoOpen(true)} size="small" sx={{ color: "#94a3b8", "&:hover": { color: "#3b82f6" } }}>
              <InfoOutlinedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>
      )}

      {/* Mobile: Card List */}
      {isMobile ? (
        filtered.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Box component="img" src="https://i.imgur.com/LdImzVA.png" alt="No products" sx={{ width: 90, mb: 1.5, opacity: 0.1 }} />
            <Typography sx={{ color: "#94a3b8", fontSize: "0.875rem" }}>No products found.</Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
            {filtered.map((p) => (
              <Box
                key={p.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  p: 1.5,
                  borderRadius: "12px",
                  border: "1px solid rgba(0,0,0,0.06)",
                  backgroundColor: "#fafbfc",
                  gap: 1.25,
                  transition: "box-shadow 0.15s",
                  "&:active": { boxShadow: "0 2px 12px rgba(0,0,0,0.06)", backgroundColor: "#fff" },
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.name}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.5, flexWrap: "wrap" }}>
                    <Chip label={p.category} size="small" sx={{ backgroundColor: "#eff6ff", color: "#3b82f6", fontSize: "0.68rem", fontWeight: 500, height: 20, border: "none" }} />
                    <Chip
                      label={`${p.stock} left`}
                      size="small"
                      sx={{
                        backgroundColor: p.stock <= p.lowStockThreshold ? "#fef2f2" : "#ecfdf5",
                        color: p.stock <= p.lowStockThreshold ? "#ef4444" : "#10b981",
                        fontWeight: 600, fontSize: "0.68rem", height: 20, border: "none",
                      }}
                    />
                  </Box>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5, flexShrink: 0 }}>
                  <Typography sx={{ fontSize: "0.9rem", fontWeight: 700, color: "#0f172a" }}>
                    ₱{p.price.toFixed(2)}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <IconButton size="small" onClick={() => handleOpen(p)}
                      sx={{ color: "#3b82f6", backgroundColor: "#eff6ff", borderRadius: "8px", width: 30, height: 30, "&:active": { transform: "scale(0.9)" } }}>
                      <EditIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => setDeleteTarget({ id: p.id, name: p.name })}
                      sx={{ color: "#ef4444", backgroundColor: "#fef2f2", borderRadius: "8px", width: 30, height: 30, "&:active": { transform: "scale(0.9)" } }}>
                      <DeleteIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        )
      ) : (
        /* Desktop: Table */
        <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid rgba(0,0,0,0.06)", borderRadius: "12px", overflow: "hidden" }}>
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
                      <Chip label={p.category} size="small" sx={{ backgroundColor: "#eff6ff", color: "#3b82f6", fontSize: "0.72rem", fontWeight: 500, border: "none" }} />
                    </TableCell>
                    <TableCell>₱{p.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip label={p.stock} size="small" sx={{ backgroundColor: p.stock <= p.lowStockThreshold ? "#fef2f2" : "#ecfdf5", color: p.stock <= p.lowStockThreshold ? "#ef4444" : "#10b981", fontWeight: 600, fontSize: "0.72rem", border: "none" }} />
                    </TableCell>
                    <TableCell sx={{ color: "#94a3b8" }}>{p.lowStockThreshold}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleOpen(p)} sx={{ mr: 0.5, color: "#3b82f6", "&:hover": { backgroundColor: "#eff6ff" } }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => setDeleteTarget({ id: p.id, name: p.name })} sx={{ color: "#ef4444", "&:hover": { backgroundColor: "#fef2f2" } }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ── Add/Edit Dialog ── */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth PaperProps={sheetPaper(isMobile)}>
        {isMobile && <DragHandle />}
        <DialogTitle sx={{ fontWeight: 600, color: "#0f172a", pb: 1, fontSize: "1rem" }}>
          {editId ? "Edit Product" : "Add Product"}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "12px !important" }}>
          <TextField label="Product Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={!!errors.name} helperText={errors.name} fullWidth size="small" sx={fieldSx} />
          <FormControl fullWidth size="small">
            <InputLabel sx={{ "&.Mui-focused": { color: "#3b82f6" } }}>Category</InputLabel>
            <Select value={form.category} label="Category" onChange={(e) => setForm({ ...form, category: e.target.value })}
              MenuProps={{ disablePortal: false, style: { zIndex: 9999 } }}
              sx={{ borderRadius: "10px", "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#3b82f6" }, "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#3b82f6" } }}>
              {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </Select>
          </FormControl>
          {[
            { label: "Price (₱)", key: "price" },
            { label: "Stock Quantity", key: "stock" },
            { label: "Low Stock Alert At", key: "lowStockThreshold" },
          ].map(({ label, key }) => (
            <TextField key={key} label={label} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              error={!!errors[key]} helperText={errors[key]} fullWidth size="small" inputMode="numeric" sx={fieldSx} />
          ))}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: isMobile ? 3 : 2.5, gap: 1 }}>
          <Button onClick={() => setOpen(false)} fullWidth={isMobile}
            sx={{ textTransform: "none", color: "#64748b", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.12)", "&:hover": { backgroundColor: "#f8fafc" } }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} fullWidth={isMobile}
            sx={{ textTransform: "none", fontWeight: 500, borderRadius: "10px", backgroundColor: "#1e3a5f", boxShadow: "none", "&:hover": { backgroundColor: "#3b82f6", boxShadow: "0 4px 14px rgba(59,130,246,0.35)" } }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirm Dialog ── */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth PaperProps={sheetPaper(isMobile)}>
        {isMobile && <DragHandle />}
        <DialogContent sx={{ pt: isMobile ? "16px !important" : "28px !important", pb: 1, px: 3, textAlign: "center" }}>
          <Box sx={{ width: 48, height: 48, borderRadius: "14px", backgroundColor: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2 }}>
            <WarningAmberRoundedIcon sx={{ color: "#ef4444", fontSize: 26 }} />
          </Box>
          <Typography sx={{ fontWeight: 600, fontSize: "1rem", color: "#0f172a", mb: 0.75 }}>
            Delete product?
          </Typography>
          <Typography sx={{ fontSize: "0.85rem", color: "#64748b", lineHeight: 1.5 }}>
            <b style={{ color: "#0f172a" }}>{deleteTarget?.name}</b> will be permanently removed. This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: isMobile ? 3 : 2.5, pt: 2, gap: 1 }}>
          <Button onClick={() => setDeleteTarget(null)} fullWidth
            sx={{ textTransform: "none", color: "#64748b", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.12)", "&:hover": { backgroundColor: "#f8fafc" } }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={confirmDelete} fullWidth
            sx={{ textTransform: "none", fontWeight: 500, borderRadius: "10px", backgroundColor: "#ef4444", boxShadow: "none", "&:hover": { backgroundColor: "#dc2626", boxShadow: "0 4px 14px rgba(239,68,68,0.35)" } }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Import Info Dialog (replaces tooltip on mobile) ── */}
      <Dialog open={infoOpen} onClose={() => setInfoOpen(false)} maxWidth="xs" fullWidth PaperProps={sheetPaper(isMobile)}>
        {isMobile && <DragHandle />}
        <DialogTitle sx={{ fontWeight: 600, color: "#0f172a", fontSize: "0.95rem", pb: 0.5 }}>
          Excel Format Guide
        </DialogTitle>
        <DialogContent sx={{ pt: "12px !important" }}>
          <Typography sx={{ fontSize: "0.82rem", color: "#64748b", mb: 1.5 }}>
            Your spreadsheet must have these column headers (any order):
          </Typography>
          {[
            { col: "Name", note: "Product name — required" },
            { col: "Category", note: "e.g. Beverages, Snacks" },
            { col: "Price", note: "Number — e.g. 25.50" },
            { col: "Stock", note: "Whole number" },
            { col: "Low Stock Threshold", note: "Whole number" },
          ].map(({ col, note }) => (
            <Box key={col} sx={{ display: "flex", gap: 1.5, mb: 1, alignItems: "flex-start" }}>
              <Chip label={col} size="small" sx={{ backgroundColor: "#eff6ff", color: "#3b82f6", fontSize: "0.72rem", fontWeight: 600, flexShrink: 0 }} />
              <Typography sx={{ fontSize: "0.8rem", color: "#64748b", pt: 0.25 }}>{note}</Typography>
            </Box>
          ))}
          <Box sx={{ mt: 2, p: 1.5, borderRadius: "10px", backgroundColor: "#fffbeb", border: "1px solid rgba(245,158,11,0.2)" }}>
            <Typography sx={{ fontSize: "0.78rem", color: "#92400e" }}>
              ⚠ Products with the same name will be overwritten.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: isMobile ? 3 : 2.5 }}>
          <Button onClick={() => setInfoOpen(false)} fullWidth variant="contained"
            sx={{ textTransform: "none", fontWeight: 500, borderRadius: "10px", backgroundColor: "#1e3a5f", boxShadow: "none", "&:hover": { backgroundColor: "#3b82f6" } }}>
            Got it
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ bottom: { xs: 80, sm: 24 } }}>
        <Alert severity={snack?.severity} onClose={() => setSnack(null)} sx={{ borderRadius: "10px" }}>
          {snack?.msg}
        </Alert>
      </Snackbar>
    </Box>
  )
}