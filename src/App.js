// src/App.js
import React from "react";
import ExportPage from "./pages/ExportPage";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute"; // Import ProtectedRoute
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import UsersPage from "./pages/UsersPage";
import ProductsPage from "./pages/ProductsPage";
import BatchesPage from "./pages/BatchesPage";
import GenerateQrPage from "./pages/GenerateQrPage";
import SettingsPage from "./pages/SettingsPage";
import SellerPage from "./pages/SellerPage";
import ManufacturingPlantsPage from "./pages/ManufacturingPlantsPage";
import RequestUserPage from "./pages/RequestUserPage";
import { ThemeProvider } from "@material-tailwind/react";
import SellerReportPage from "./pages/SellerReportPage";
import CompaniesPage from "./pages/CompaniesPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SchemePage from "./pages/SchemePage";

const App = () => {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={<ProtectedRoute element={<DashboardPage />} />}
          />
          <Route
            path="/users"
            element={<ProtectedRoute element={<UsersPage />} />}
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute
                element={<ProductsPage />}
                allowedRoles={["admin", "master", "staff"]}
              />
            }
          />
          <Route
            path="/batches"
            element={
              <ProtectedRoute
                element={<BatchesPage />}
                allowedRoles={["admin", "master", "staff"]}
              />
            }
          />
          <Route
            path="/generate-qr"
            element={<ProtectedRoute element={<GenerateQrPage />} />}
          />
          <Route
            path="/settings"
            element={<ProtectedRoute element={<SettingsPage />} />}
          />
          <Route
            path="/seller"
            element={<ProtectedRoute element={<SellerPage />} />}
          />
          <Route
            path="/seller-report"
            element={<ProtectedRoute element={<SellerReportPage />} />}
          />
          <Route
            path="/manufacturing-plants"
            element={<ProtectedRoute element={<ManufacturingPlantsPage />} />}
          />
          <Route
            path="/companies"
            element={<ProtectedRoute element={<CompaniesPage />} />}
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute
                element={<AnalyticsPage />}
                allowedRoles={["admin", "master"]}
              />
            }
          />
          <Route
            path="/scheme"
            element={
              <ProtectedRoute
                element={<SchemePage />}
                allowedRoles={["master"]}
              />
            }
          />
          <Route path="/request" element={<RequestUserPage />} />
          <Route
            path="/export"
            element={
              <ProtectedRoute
                element={<ExportPage />}
                allowedRoles={["admin"]}
              />
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
