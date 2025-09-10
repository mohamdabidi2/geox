import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Grid3X3,
  BarChart3,
  FileText,
  HelpCircle,
  Settings,
  Home,
  Users,
  Layers,
  Store,
  Package,
  ShoppingCart,
  FileText as PurchaseFileText,
  Lock
} from 'lucide-react';
import EnhancedSidebar from './pages/shared/EnhancedSidebar';
import Logo from './assets/logo.png';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Collapsible state for Gestion Stock & Achats
  const [stockOpen, setStockOpen] = useState(() => {
    // Open by default if on a stock-related route
    const stockPaths = [
      '/stock/menu',
      '/stock/magasins',
      '/stock/categories',
      '/stock/products',
      '/stock/suppliers',
      '/stock/purchase-requests',
      '/stock/purchase-orders',
      '/stock/management',
      '/stock/permissions'
    ];
    return stockPaths.includes(location.pathname);
  });

  // Main navigation: Dashboard, Gestion Utilisateurs, Gestion Stock & Achats (collapsible)
  const getNavigationItems = () => {
    const currentPath = location.pathname;
    const stockPaths = [
      '/admin/stock-menu',
      '/magasins',
      '/categories',
      '/products',
      '/suppliers',
      '/purchase-requests',
      '/purchase-orders',
      '/stock',
      '/permissions',
      // Also support new stock routes from App.jsx
      '/stock/menu',
      '/stock/magasins',
      '/stock/categories',
      '/stock/products',
      '/stock/suppliers',
      '/stock/purchase-requests',
      '/stock/purchase-orders',
      '/stock/management',
      '/stock/permissions'
    ];

    return [
      {
        icon: Home,
        label: 'Dashboard',
        path: '/dashboard',
        active: currentPath === '/dashboard' || currentPath === '/admin' || currentPath === '/Modules',
        onClick: (e) => {
          e.preventDefault();
          navigate('/dashboard');
        }
      },
      {
        icon: Users,
        label: 'Gestion Utilisateurs',
        path: '/admin/users',
        active: currentPath === '/admin/users',
        onClick: (e) => {
          e.preventDefault();
          navigate('/admin/users');
        }
      },
      {
        icon: Grid3X3,
        label: 'Gestion Stock & Achats',
        path: '#', // Use '#' for parent items that are collapsible
        active: stockPaths.includes(currentPath),
        onClick: (e) => {
          e.preventDefault();
          setStockOpen((open) => !open);
        },
        collapsible: true,
        open: stockOpen,
        children: [
          {
            icon: BarChart3,
            label: 'Menu Stock',
            path: '/stock/menu',
            active: currentPath === '/admin/stock-menu' || currentPath === '/stock/menu',
            onClick: (e) => {
              e.preventDefault();
              navigate('/stock/menu');
            }
          },
          {
            icon: Store,
            label: 'Magasins',
            path: '/stock/magasins',
            active: currentPath === '/magasins' || currentPath === '/stock/magasins',
            onClick: (e) => {
              e.preventDefault();
              navigate('/stock/magasins');
            }
          },
          {
            icon: Layers,
            label: 'Catégories',
            path: '/stock/categories',
            active: currentPath === '/categories' || currentPath === '/stock/categories',
            onClick: (e) => {
              e.preventDefault();
              navigate('/stock/categories');
            }
          },
          {
            icon: Package,
            label: 'Produits',
            path: '/stock/products',
            active: currentPath === '/products' || currentPath === '/stock/products',
            onClick: (e) => {
              e.preventDefault();
              navigate('/stock/products');
            }
          },
          {
            icon: Users,
            label: 'Fournisseurs',
            path: '/stock/suppliers',
            active: currentPath === '/suppliers' || currentPath === '/stock/suppliers',
            onClick: (e) => {
              e.preventDefault();
              navigate('/stock/suppliers');
            }
          },
          {
            icon: PurchaseFileText,
            label: "Demandes d'Achat",
            path: '/stock/purchase-requests',
            active: currentPath === '/purchase-requests' || currentPath === '/stock/purchase-requests',
            onClick: (e) => {
              e.preventDefault();
              navigate('/stock/purchase-requests');
            }
          },
          {
            icon: ShoppingCart,
            label: "Commandes d'Achat",
            path: '/stock/purchase-orders',
            active: currentPath === '/purchase-orders' || currentPath === '/stock/purchase-orders',
            onClick: (e) => {
              e.preventDefault();
              navigate('/stock/purchase-orders');
            }
          },
          {
            icon: BarChart3,
            label: 'Gestion des Stocks',
            path: '/stock/management',
            active: currentPath === '/stock' || currentPath === '/stock/management',
            onClick: (e) => {
              e.preventDefault();
              navigate('/stock/management');
            }
          },
          {
            icon: Lock,
            label: 'Permissions',
            path: '/stock/permissions',
            active: currentPath === '/permissions' || currentPath === '/stock/permissions',
            onClick: (e) => {
              e.preventDefault();
              navigate('/stock/permissions');
            }
          }
        ]
      },
      {
        icon: BarChart3,
        label: 'Gestion des Postes',
        path: '/admin/Posts',
        active: currentPath === '/admin/Posts',
        onClick: (e) => {
          e.preventDefault();
          navigate('/admin/Posts');
        }
      }
    ];
  };

  const getSupportItems = () => {
    const currentPath = location.pathname;
    return [
      {
        icon: HelpCircle,
        label: 'Help Center',
        path: '/help',
        active: currentPath === '/help',
        onClick: (e) => {
          e.preventDefault();
          navigate('/help');
        }
      },
      {
        icon: Settings,
        label: 'Settings',
        path: '/settings',
        active: currentPath === '/settings',
        onClick: (e) => {
          e.preventDefault();
          navigate('/settings');
        }
      }
    ];
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <EnhancedSidebar
        logoUrl={Logo}
        navigationItems={getNavigationItems()}
        supportItems={getSupportItems()}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-72 overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default Layout;