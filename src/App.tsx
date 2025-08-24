// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/admin/LoginPage";
import AdminLayout from "./components/admin/AdminLayout";
import PrivateRoute from "./components/admin/PrivateRoute";
import MaterialsPage from "./pages/admin/MaterialsPage";

// Página de ejemplo para el dashboard
const DashboardPage = () => <h1>Bienvenido al Dashboard</h1>;

function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta pública para el Login */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* Rutas privadas para el panel de administración */}
        <Route element={<PrivateRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="materials" element={<MaterialsPage />} />
            {/* Añadir más rutas aquí (cantos, cortes, etc.) */}
          </Route>
        </Route>

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/admin/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
