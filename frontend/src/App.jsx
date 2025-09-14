import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { StockProvider } from './contexts/StockContext';
import TableauBordDroits from './pages/Droits/TableauBordDroits';
import StockManagement from './pages/stock/StockManagement';
import PurchaseOrderManagement from './pages/stock/PurchaseOrderManagement';
import PurchaseRequestManagement from './pages/stock/PurchaseRequestManagement';
import PostManagement from './pages/postes/PostManagement';
import SupplierManagement from './pages/stock/SupplierManagement';
import ProductManagement from './pages/stock/ProductManagement';
import CategoryManagement from './pages/stock/CategoryManagement';
import MagasinManagement from './pages/stock/MagasinManagement';
import UserManagement from './pages/Users/UserManagement';
import LoginPage from './pages/LoginPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import PasswordCreationPage from './pages/PasswordCreationPage';
import Layout from './Layout';
import StockCards from './pages/stock/Layer';
import DashboardPage from './pages/DashboardPage';

function App() {
  // Protected Route Component - defined INSIDE App to have access to AuthProvider
  const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isFullyVerified, loading, user } = useAuth();
    const navigate = useNavigate();

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      );
    }

    // Check if token exists first, then check user authentication
    const token = localStorage.getItem('token');

    if (!token) {
      return <Navigate to="/login" replace />;
    }

    // If we have a token but user data isn't loaded yet, show loading
    if (token && !user) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      );
    }
    
    if (!isFullyVerified()) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full text-center">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Pending Approval</h2>
              <p className="text-gray-600 mb-4">
                Your profile is not yet fully validated. Please wait until RH and Direction confirm it.
              </p>
              <button
                onClick={() => {
                  navigate(0); // This is a soft refresh without full page reload
                }}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Refresh Status
              </button>
            </div>
          </div>
        </div>
      );
    }
    return children;
  };

  // Public Route Component - defined INSIDE App
  const PublicRoute = ({ children }) => {
    // Only check localStorage for token, don't use useAuth here
    const token = localStorage.getItem('token');

    if (token) {
      return <Navigate to="/dashboard" replace />;
    }

    return children;
  };

  // Helper to check if user has a valid magasin_id
  const hasValidMagasinId = (user) => {
    // Accepts non-null, non-empty, non-undefined
    // console.log(user)
    return user && user.magasin && user.magasin.id !== null && user.magasin.id !== undefined && user.magasin.id !== '';
  };

  // AppRoutes component - defined INSIDE App
  const AppRoutes = () => {
    // We need user for magasin_id check, so get it from useAuth
    const { user } = useAuth();

    return (
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage user={user} />
            </PublicRoute>
          }
        />
        <Route
          path="/email-verification"
          element={<EmailVerificationPage user={user} />}
        />
    <Route
  path="/verify-email/:token"
  element={<PasswordCreationPage />} // Remove the user prop
/>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout user={user}>
                <DashboardPage user={user} />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <Layout user={user}>
                <UserManagement user={user} />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Stock management routes only if user.magasin_id is valid */}
        {
          <>
            <Route path="/stock/magasins" element={
              <ProtectedRoute>
                <Layout user={user}>
                  <MagasinManagement user={user} />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/stock/categories" element={
              <ProtectedRoute>
                <Layout user={user}>
                  <CategoryManagement user={user} />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/stock/products" element={
              <ProtectedRoute>
                <Layout user={user}>
                  <ProductManagement user={user} />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/stock/suppliers" element={
              <ProtectedRoute>
                <Layout user={user}>
                  <SupplierManagement user={user} />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/stock/menu" element={
              <ProtectedRoute>
                <Layout user={user}>
                  <StockCards user={user} />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/stock/purchase-requests" element={
              <ProtectedRoute>
                <Layout user={user}>
                  <PurchaseRequestManagement user={user} />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/stock/purchase-orders" element={
              <ProtectedRoute>
                <Layout user={user}>
                  <PurchaseOrderManagement user={user} />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/stock/management" element={
              <ProtectedRoute>
                <Layout user={user}>
                  <StockManagement user={user} />
                </Layout>
              </ProtectedRoute>
            } />
            <Route
              path="/stock/permissions"
              element={
                <ProtectedRoute>
                  <Layout user={user}>
                    <TableauBordDroits user={user} />
                  </Layout>
                </ProtectedRoute>
              }
            />
          </>
        }

        {/* These routes are not part of "gestion de stock" and are always available */}
        <Route path="/admin/Posts" element={
          <ProtectedRoute>
            <Layout user={user}>
              <PostManagement user={user} />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/Modules" element={
          <ProtectedRoute>
            <Layout user={user}>
              <DashboardPage user={user} />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  };

  return (
    <AuthProvider>
      <StockProvider>
        <Router>
          <div className="App">
            <AppRoutes />
          </div>
        </Router>
      </StockProvider>
    </AuthProvider>
  );
}

export default App;