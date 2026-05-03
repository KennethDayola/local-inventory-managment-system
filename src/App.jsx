import { BrowserRouter, Routes, Route } from "react-router-dom"
import { ThemeProvider, CssBaseline } from "@mui/material"
import theme from "./theme"
import Navbar from "./components/Navbar"
import Dashboard from "./pages/Dashboard"
import Products from "./pages/Products"
import Transactions from "./pages/Transactions"
import Sales from "./pages/Sales"

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/sales" element={<Sales />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}