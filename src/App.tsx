import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppShell } from "@/components/layout/AppShell";

// Pages
import Dashboard from "./pages/Dashboard";
import OrdersPage from "./pages/OrdersPage";
import ValidationPage from "./pages/ValidationPage";
import ReturnsPage from "./pages/ReturnsPage";
import HistoryPage from "./pages/HistoryPage";
import GoodsPage from "./pages/GoodsPage";
import EmployeesPage from "./pages/EmployeesPage";
import {
  AdmissionPage,
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppShell>
              <Routes>
                {/* Dashboard */}
                <Route path="/" element={<Dashboard />} />
                
                {/* Operational Modules */}
                <Route path="/admission" element={<AdmissionPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/collect" element={<CollectPage />} />
                <Route path="/validation" element={<ValidationPage />} />
                <Route path="/returns" element={<ReturnsPage />} />
                <Route path="/move-to-region" element={<MoveToRegionPage />} />
                <Route path="/relocation" element={<RelocationPage />} />
                <Route path="/history" element={<HistoryPage />} />
                
                {/* Master Data */}
                <Route path="/warehouse" element={<WarehousePage />} />
                <Route path="/employees" element={<EmployeesPage />} />
                <Route path="/cells" element={<CellsPage />} />
                <Route path="/goods" element={<GoodsPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/bonuses" element={<BonusesPage />} />
                
                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppShell>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
