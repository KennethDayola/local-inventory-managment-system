import { BrowserRouter, Routes, Route } from "react-router-dom"
import { ThemeProvider, CssBaseline, Box } from "@mui/material"
import theme from "./theme"
import Sidebar from "./components/Sidebar"
import Dashboard from "./pages/Dashboard"
import Products from "./pages/Products"
import Transactions from "./pages/Transactions"
import Sales from "./pages/Sales"

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Box sx={{ display: "flex" }}>
          <Sidebar />
          <Box sx={{ ml: "210px", flex: 1, minHeight: "100vh", backgroundColor: "#fafbff" }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/sales" element={<Sales />} />
            </Routes>
          </Box>
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  )
}