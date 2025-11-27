// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QuoteProvider } from "./context/QuoteContext";

import LoginPage from "./pages/admin/LoginPage";
import AdminLayout from "./components/admin/AdminLayout";
import PrivateRoute from "./components/admin/PrivateRoute";
import MaterialsPage from "./pages/admin/MaterialsPage";
import EdgeProfilesPage from "./pages/admin/EdgeProfilesPage";
import CutoutsPage from "./pages/admin/CutoutsPage";
import PriceConfigsPage from "./pages/admin/PriceConfigsPage";
import AttributesPage from "./pages/admin/AttributesPage";
import DashboardPage from "./pages/admin/DashboardPage";
import NewQuoteWizardPage from "./pages/public/QuoteWizard/NewQuoteWizardPage";
import AddonsPage from "./pages/admin/AddonsPage";
import MeasurementRuleSetPage from "./pages/admin/MeasurementRuleSetPage";

function App() {
  return (
    <Router>
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
    </Router>
  );
}

export default App;
