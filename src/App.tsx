// src/App.tsx
import { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QuoteProvider } from "./context/QuoteContext";
import { Box, CircularProgress } from "@mui/material";

// Lazy imports for pages and layouts
const LoginPage = lazy(() => import("./pages/admin/LoginPage"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const PrivateRoute = lazy(() => import("./components/admin/PrivateRoute"));
const MaterialsPage = lazy(() => import("./pages/admin/MaterialsPage"));
const EdgeProfilesPage = lazy(() => import("./pages/admin/EdgeProfilesPage"));
const CutoutsPage = lazy(() => import("./pages/admin/CutoutsPage"));
const PriceConfigsPage = lazy(() => import("./pages/admin/PriceConfigsPage"));
const AttributesPage = lazy(() => import("./pages/admin/AttributesPage"));
const DashboardPage = lazy(() => import("./pages/admin/DashboardPage"));
const NewQuoteWizardPage = lazy(() => import("./pages/public/QuoteWizard/NewQuoteWizardPage"));
const AddonsPage = lazy(() => import("./pages/admin/AddonsPage"));
const MeasurementRuleSetPage = lazy(() => import("./pages/admin/MeasurementRuleSetPage"));

// Loading Fallback Component
const LoadingFallback = () => (
  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
    <CircularProgress />
  </Box>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* RUTA PÚBLICA PARA EL PRESUPUESTADOR */}
          <Route
            path="/quote"
            element={
              <QuoteProvider>
                {" "}
                {/* 3. Envuelve el asistente con el proveedor */}
                <NewQuoteWizardPage />
              </QuoteProvider>
            }
          />

          {/* Ruta pública para el Login */}
          <Route path="/admin/login" element={<LoginPage />} />

          {/* Rutas privadas para el panel de administración */}
          <Route element={<PrivateRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="materials" element={<MaterialsPage />} />
              <Route path="rule-sets" element={<MeasurementRuleSetPage />} />
              <Route path="addons" element={<AddonsPage />} />
              <Route path="edges" element={<EdgeProfilesPage />} />
              <Route path="cutouts" element={<CutoutsPage />} />
              <Route path="price-configs" element={<PriceConfigsPage />} />
              <Route path="attributes" element={<AttributesPage />} />
              {/* Añadir más rutas aquí (cantos, cortes, etc.) */}
            </Route>
          </Route>

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/quote" />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
