// config/routes.config.ts
import { lazy } from "react";
import { UserRole, type AppRouteConfig } from "../types/auth.types";

// Lazy loading tipado
const NewQuoteWizardPage = lazy(() => import("@/pages/public/QuoteWizard/NewQuoteWizardPage"));
const AdminLayout = lazy(() => import("@/components/admin/AdminLayout"));
const LoginPage = lazy(() => import("@/pages/admin/LoginPage"));
const DashboardPage = lazy(() => import("@/pages/admin/DashboardPage"));
const MaterialsPage = lazy(() => import("@/pages/admin/MaterialsPage"));
const MeasurementRuleSetPage = lazy(() => import("@/pages/admin/MeasurementRuleSetPage"));
const AddonsPage = lazy(() => import("@/pages/admin/AddonsPage"));
const EdgeProfilesPage = lazy(() => import("@/pages/admin/EdgeProfilesPage"));
const CutoutsPage = lazy(() => import("@/pages/admin/CutoutsPage"));
const PriceConfigsPage = lazy(() => import("@/pages/admin/PriceConfigsPage"));
const AttributesPage = lazy(() => import("@/pages/admin/AttributesPage"));
const OrdersPage = lazy(() => import("@/pages/admin/OrdersTable"));

// ADMIN: "ADMIN",
// SALES_FACTORY: "SALES_FACTORY",
// WORKER: "WORKER",
// SALES_SHOP: "SALES_SHOP",
// USER: "USER",

export const appRoutes: AppRouteConfig[] = [
  // 1. RUTA PÚBLICA (Presupuestador)
  {
    path: "/quote",
    component: NewQuoteWizardPage,
    // Array vacío o null significa "Público"
    allowedRoles: [UserRole.ADMIN, UserRole.SALES_FACTORY, UserRole.SALES_SHOP, UserRole.USER],
  },

  // 2. LOGIN
  {
    path: "/login",
    component: LoginPage,
    allowedRoles: [],
  },

  // 3. RUTAS PROTEGIDAS (ADMIN)
  // Nota: El componente principal es el LAYOUT
  {
    path: "/admin",
    component: AdminLayout,
    allowedRoles: [UserRole.ADMIN], // El Guard protegerá todo lo que esté dentro
    children: [
      { path: "dashboard", component: DashboardPage, allowedRoles: [UserRole.ADMIN] },
      { path: "materials", component: MaterialsPage, allowedRoles: [UserRole.ADMIN] },
      { path: "rule-sets", component: MeasurementRuleSetPage, allowedRoles: [UserRole.ADMIN] },
      { path: "addons", component: AddonsPage, allowedRoles: [UserRole.ADMIN] },
      { path: "edges", component: EdgeProfilesPage, allowedRoles: [UserRole.ADMIN] },
      { path: "cutouts", component: CutoutsPage, allowedRoles: [UserRole.ADMIN] },
      { path: "price-configs", component: PriceConfigsPage, allowedRoles: [UserRole.ADMIN] },
      { path: "attributes", component: AttributesPage, allowedRoles: [UserRole.ADMIN] },
      { path: "orders", component: OrdersPage, allowedRoles: [UserRole.ADMIN] },
    ],
  },
];
