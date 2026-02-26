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
const UsersPage = lazy(() => import("@/pages/admin/UsersPage"));
const CustomersPage = lazy(() => import("@/pages/admin/CustomersPage"));
const DiscountRulesPage = lazy(() => import("@/pages/admin/DiscountRulesPage"));
const FactoryPosPage = lazy(() => import("@/pages/worker/FactoryPosPage"));

// USER PORTAL
const UserPortalLayout = lazy(() => import("@/pages/public/UserPortal/layout/UserPortalLayout"));
const UserDashboard = lazy(() => import("@/pages/public/UserPortal/views/Dashboard"));
const UserQuotes = lazy(() => import("@/pages/public/UserPortal/views/MyQuotes"));
const UserDrafts = lazy(() => import("@/pages/public/UserPortal/views/Drafts"));
const UserProfile = lazy(() => import("@/pages/public/UserPortal/views/UserProfile"));
const CartView = lazy(() => import("@/pages/public/UserPortal/views/Cart"));

export const appRoutes: AppRouteConfig[] = [
  // 1. LOGIN [RUTA PÚBLICA]
  {
    path: "/login",
    component: LoginPage,
    allowedRoles: [],
  },

  // 2. PRESUPUESTADOR
  {
    path: "/quote",
    component: NewQuoteWizardPage,
    // Array vacío o null significa "Público"
    allowedRoles: [UserRole.ADMIN, UserRole.SALES, UserRole.USER],
  },

  // 3. USER PORTAL (Client)
  {
    path: "/",
    component: UserPortalLayout,
    allowedRoles: [UserRole.USER, UserRole.ADMIN, UserRole.SALES],
    children: [
      { path: "dashboard", component: UserDashboard, allowedRoles: [UserRole.USER, UserRole.SALES, UserRole.ADMIN] },
      { path: "my-quotes", component: UserQuotes, allowedRoles: [UserRole.USER, UserRole.SALES, UserRole.ADMIN] },
      { path: "cart", component: CartView, allowedRoles: [UserRole.USER, UserRole.SALES, UserRole.ADMIN] },
      { path: "drafts", component: UserDrafts, allowedRoles: [UserRole.USER, UserRole.SALES, UserRole.ADMIN] },
      { path: "user-profile", component: UserProfile, allowedRoles: [UserRole.USER, UserRole.SALES, UserRole.ADMIN] },
    ],
  },

  // 4. PANEL DE ADMIN (ADMIN & SALES)
  {
    path: "/admin",
    component: AdminLayout,
    allowedRoles: [UserRole.ADMIN, UserRole.SALES],
    children: [
      { path: "dashboard", component: DashboardPage, allowedRoles: [UserRole.ADMIN, UserRole.SALES] },
      { path: "orders", component: OrdersPage, allowedRoles: [UserRole.ADMIN, UserRole.SALES] },
      { path: "users", component: UsersPage, allowedRoles: [UserRole.ADMIN] },
      { path: "customers", component: CustomersPage, allowedRoles: [UserRole.ADMIN, UserRole.SALES] },
      { path: "discount-rules", component: DiscountRulesPage, allowedRoles: [UserRole.ADMIN, UserRole.SALES] },
      { path: "materials", component: MaterialsPage, allowedRoles: [UserRole.ADMIN] },
      { path: "rule-sets", component: MeasurementRuleSetPage, allowedRoles: [UserRole.ADMIN] },
      { path: "addons", component: AddonsPage, allowedRoles: [UserRole.ADMIN] },
      { path: "edges", component: EdgeProfilesPage, allowedRoles: [UserRole.ADMIN] },
      { path: "cutouts", component: CutoutsPage, allowedRoles: [UserRole.ADMIN] },
      { path: "price-configs", component: PriceConfigsPage, allowedRoles: [UserRole.ADMIN] },
      { path: "attributes", component: AttributesPage, allowedRoles: [UserRole.ADMIN] },
    ],
  },

  // 5. FACTORY POS (WORKER)
  {
    path: "/factory-pos",
    component: FactoryPosPage,
    allowedRoles: [UserRole.WORKER],
  },
];
