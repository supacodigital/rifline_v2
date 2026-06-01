import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { I18nProvider } from './context/I18nContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import CartDrawer from './components/cart/CartDrawer';
import WhatsAppButton from './components/ui/WhatsAppButton';

import Home from './pages/Home/Home';
import Catalog from './pages/Catalog/Catalog';
import ProductDetail from './pages/ProductDetail/ProductDetail';
import Login from './pages/Account/Login/Login';
import Register from './pages/Account/Register/Register';
import ForgotPassword from './pages/Account/ForgotPassword/ForgotPassword';
import ResetPassword from './pages/Account/ResetPassword/ResetPassword';
import Dashboard from './pages/Account/Dashboard/Dashboard';
import Profile from './pages/Account/Profile/Profile';
import Orders from './pages/Account/Orders/Orders';
import Checkout from './pages/Checkout/Checkout';
import OrderConfirmation from './pages/OrderConfirmation/OrderConfirmation';
import AdminLayout from './pages/Admin/AdminLayout';
import AdminDashboard from './pages/Admin/Dashboard/AdminDashboard';
import AdminProducts from './pages/Admin/Products/AdminProducts';
import AdminOrders from './pages/Admin/Orders/AdminOrders';
import AdminUsers from './pages/Admin/Users/AdminUsers';
import AdminCategories from './pages/Admin/Categories/AdminCategories';
import NotFound from './pages/NotFound/NotFound';
import MentionsLegales from './pages/Legal/MentionsLegales';
import CGV from './pages/Legal/CGV';
import Confidentialite from './pages/Legal/Confidentialite';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/compte/connexion" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  return children;
};

const AppLayout = () => {
  const [cartOpen, setCartOpen] = useState(false);
  const { pathname } = useLocation();
  const isProductPage = pathname.startsWith('/produit/');

  return (
    <>
      <Header onCartOpen={() => setCartOpen(true)} />
      <main>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/catalogue" element={<Catalog />} />
          <Route path="/produit/:slug" element={<ProductDetail />} />
          <Route path="/compte/connexion" element={<Login />} />
          <Route path="/compte/inscription" element={<Register />} />
          <Route path="/compte/mot-de-passe-oublie" element={<ForgotPassword />} />
          <Route path="/compte/reinitialiser-mot-de-passe" element={<ResetPassword />} />

          {/* Espace client */}
          <Route path="/compte" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/compte/profil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/compte/commandes" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/compte/commandes/:id" element={<ProtectedRoute><Orders /></ProtectedRoute>} />

          {/* Checkout */}
          <Route path="/commande" element={<Checkout />} />
          <Route path="/commande/confirmation" element={<OrderConfirmation />} />

          {/* Pages légales */}
          <Route path="/mentions-legales" element={<MentionsLegales />} />
          <Route path="/cgv" element={<CGV />} />
          <Route path="/confidentialite" element={<Confidentialite />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <WhatsAppButton elevated={isProductPage} />
    </>
  );
};

const AdminGuard = () => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/compte/connexion" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <AdminLayout />;
};

const App = () => (
  <BrowserRouter>
    <I18nProvider>
    <AuthProvider>
      <CartProvider>
        <Routes>
          {/* Back-office — layout isolé, sans Header/Footer/Panier */}
          <Route path="/admin" element={<AdminGuard />}>
            <Route index element={<AdminDashboard />} />
            <Route path="produits" element={<AdminProducts />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="commandes" element={<AdminOrders />} />
            <Route path="clients" element={<AdminUsers />} />
          </Route>

          {/* Site client */}
          <Route path="*" element={<AppLayout />} />
        </Routes>
      </CartProvider>
    </AuthProvider>
    </I18nProvider>
  </BrowserRouter>
);

export default App;
