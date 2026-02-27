// App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CollectNotificationProvider } from "@/contexts/CollectNotificationContext";
import { RequiredTransfersNotificationProvider } from "@/contexts/RequiredTransfersNotificationContext";
import { Provider } from "react-redux";
import store from "./redux/store/store";

import { AppShell } from "@/components/layout/AppShell";

import Dashboard from "./pages/Dashboard";
import OrdersPage from "./pages/OrdersPage";
import ValidationPage from "./pages/ValidationPage";
import ReturnsPage from "./pages/ReturnsPage";
import HistoryPage from "./pages/HistoryPage";
import GoodsPage from "./pages/GoodsPage";
import EmployeesPage from "./pages/EmployeesPage";
import AdmissionPage from "./pages/AdmissionPage";
import RequiredTransfersPage from "./pages/RequiredTransfersPage";
import {
  CollectPage,
  MoveToRegionPage,
  RelocationPage,
  WarehousePage,
  CellsPage,
  InventoryPage,
  ReportsPage,
  BonusesPage,
} from "./pages/PlaceholderPages";
import NotFound from "./pages/NotFound";

import PublicRoute from "./components/layout/PublicRoute";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import LoginPage from "./pages/Login";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Provider store={store}>
      <AuthProvider>
        <CollectNotificationProvider>
          <RequiredTransfersNotificationProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  {/* Public */}
                  <Route
                    path="/login"
                    element={
                      <PublicRoute>
                        <LoginPage />
                      </PublicRoute>
                    }
                  />

                  {/* Protected area */}
                  <Route element={<ProtectedRoute />}>
                    <Route element={<AppShell />}>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/admission" element={<AdmissionPage />} />
                      <Route path="/orders" element={<OrdersPage />} />
                      <Route path="/collect" element={<CollectPage />} />
                      <Route path="/validation" element={<ValidationPage />} />
                      <Route path="/returns" element={<ReturnsPage />} />
                      <Route
                        path="/move-to-region"
                        element={<MoveToRegionPage />}
                      />
                      <Route path="/relocation" element={<RelocationPage />} />
                      <Route path="/required-transfers" element={<RequiredTransfersPage />} />
                      <Route path="/history" element={<HistoryPage />} />
                      <Route path="/warehouse" element={<WarehousePage />} />
                      <Route path="/employees" element={<EmployeesPage />} />
                      <Route path="/cells" element={<CellsPage />} />
                      <Route path="/goods" element={<GoodsPage />} />
                      <Route path="/inventory" element={<InventoryPage />} />
                      <Route path="/reports" element={<ReportsPage />} />
                      <Route path="/bonuses" element={<BonusesPage />} />
                    </Route>
                  </Route>

                  {/* Catch-all */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </RequiredTransfersNotificationProvider>
        </CollectNotificationProvider>
      </AuthProvider>
    </Provider>
  </QueryClientProvider>
);

export default App;
