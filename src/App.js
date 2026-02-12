// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@material-tailwind/react";
import { AuthProvider } from "./context/AuthContext";
import AppLayout from "./layouts/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// Auth Pages
import LoginPage from "./pages/LoginPage";
import LoginPswdPage from "./pages/LoginPswdPage";
import RequestUserPage from "./pages/RequestUserPage";

// Protected Pages
import DashboardPage from "./pages/DashboardPage";
import UsersPage from "./pages/UsersPage";
import ProductsPage from "./pages/ProductsPage";
import BatchesPage from "./pages/BatchesPage";
import GenerateQrPage from "./pages/GenerateQrPage";
import SettingsPage from "./pages/SettingsPage";
import SellerPage from "./pages/SellerPage";
import ManufacturingPlantsPage from "./pages/ManufacturingPlantsPage";
import SellerReportPage from "./pages/SellerReportPage";
import CompaniesPage from "./pages/CompaniesPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SchemePage from "./pages/SchemePage";
import IndentPage from "./pages/IndentPage";
import ShipmentPage from "./pages/ShipmentPage";
import StocksReportPage from "./pages/StocksReportPage";
import CashbackReportPage from "./pages/CashbackReportPage";
import SchemeReportPage from "./pages/SchemeReportPage";
import ExportPage from "./pages/ExportPage";
import PackPage from "./pages/PackPage";

const App = () => {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/login-password" element={<LoginPswdPage />} />
            <Route path="/request" element={<RequestUserPage />} />

            {/* Protected Routes with Layout */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/generate-qr" element={<GenerateQrPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/seller" element={<SellerPage />} />
                <Route path="/seller-report" element={<SellerReportPage />} />
                <Route path="/manufacturing-plants" element={<ManufacturingPlantsPage />} />
                <Route path="/companies" element={<CompaniesPage />} />
                <Route path="/stocks-report" element={<StocksReportPage />} />
                <Route path="/cashback-report" element={<CashbackReportPage />} />
                <Route path="/scheme-report" element={<SchemeReportPage />} />
              </Route>
            </Route>

            {/* Role-protected routes */}
            <Route element={<ProtectedRoute allowedRoles={["admin", "master", "staff"]} />}>
              <Route element={<AppLayout />}>
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/batches" element={<BatchesPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["admin", "master"]} />}>
              <Route element={<AppLayout />}>
                <Route path="/analytics" element={<AnalyticsPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["master"]} />}>
              <Route element={<AppLayout />}>
                <Route path="/scheme" element={<SchemePage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["admin", "master", "plant_owner", "salesman"]} />}>
              <Route element={<AppLayout />}>
                <Route path="/indent" element={<IndentPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["admin", "master", "plant_owner", "staff"]} />}>
              <Route element={<AppLayout />}>
                <Route path="/shipment" element={<ShipmentPage />} />
                <Route path="/pack" element={<PackPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
              <Route element={<AppLayout />}>
                <Route path="/export" element={<ExportPage />} />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
