import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
 
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import AnalysisPage from "./pages/AnalysisPage";
import SavedAnalysesPage from "./pages/SavedAnalysesPage";
import PendingApprovalsPage from "./pages/PendingApprovalsPage";
 
// draw-pattern için yeni sayfa varsa onu kullan
import DrawPatternPage from "./pages/DrawPatternPage";
// fallback: CustomPatternPage halen varsa, DrawPatternPage içinde kullanıyorsundur
import CustomPatternPage from "./pages/CustomPatternPage";
 
import "./App.css";
 
// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
 
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F1EA] flex items-center justify-center">
        <div className="animate-pulse text-[#7A6A5C]">Yükleniyor...</div>
      </div>
    );
  }
 
  if (!user) {
    return <Navigate to="/login" replace />;
  }
 
  return children;
};
 
// Admin Route Component
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
 
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F1EA] flex items-center justify-center">
        <div className="animate-pulse text-[#7A6A5C]">Yükleniyor...</div>
      </div>
    );
  }
 
  if (!user) {
    return <Navigate to="/login" replace />;
  }
 
  const isAdmin = user?.role === "admin" || user?.email === "emrekirbayir@gmail.com";
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
 
  return children;
};
 
// Public Route - Redirect to dashboard if logged in
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
 
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F1EA] flex items-center justify-center">
        <div className="animate-pulse text-[#7A6A5C]">Yükleniyor...</div>
      </div>
    );
  }
 
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
 
  return children;
};
 
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
 
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
 
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />
 
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
 
          <Route
            path="/analysis"
            element={
              <ProtectedRoute>
                <AnalysisPage />
              </ProtectedRoute>
            }
          />
 
          {/* yeni route */}
          <Route
            path="/draw-pattern"
            element={
              <ProtectedRoute>
                <DrawPatternPage />
              </ProtectedRoute>
            }
          />
 
          {/* eski linkler bozulmasın */}
          <Route path="/custom-pattern" element={<Navigate to="/draw-pattern" replace />} />
 
          <Route
            path="/saved"
            element={
              <ProtectedRoute>
                <SavedAnalysesPage />
              </ProtectedRoute>
            }
          />
 
          <Route
            path="/admin/pending-approvals"
            element={
              <AdminRoute>
                <PendingApprovalsPage />
              </AdminRoute>
            }
          />
 
          {/* Safety: DrawPatternPage dosyası boş/yanlışsa */}
          <Route
            path="/_debug/custom-pattern"
            element={
              <ProtectedRoute>
                <CustomPatternPage />
              </ProtectedRoute>
            }
          />
        </Routes>
 
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </AuthProvider>
  );
}
 
export default App;
