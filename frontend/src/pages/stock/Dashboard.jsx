import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import axios from 'axios';
import {
  Package,
  Users,
  ShoppingCart,
  AlertTriangle,
  Store,
  Activity,
  DollarSign,
  Calendar
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    totalSuppliers: 0,
    lowStockAlerts: 0,
    pendingRequests: 0,
    pendingOrders: 0,
    totalStock: 0,
    recentActivities: []
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const magasinId = user.magasin.id;
      
      const [
        productsRes,
        categoriesRes,
        suppliersRes,
        stockAlertsRes,
        purchaseRequestsRes,
        purchaseOrdersRes,
        stockLevelsRes
      ] = await Promise.all([
        axios.get(`http://localhost:5000/api/produits/magasin/${magasinId}`),
        axios.get(`http://localhost:5000/api/categories/magasin/${magasinId}`),
        axios.get(`http://localhost:5000/api/fournisseurs/magasin/${magasinId}`),
        axios.get(`http://localhost:5000/api/stock/alerts/magasin/${magasinId}`),
        axios.get(`http://localhost:5000/api/demandes-achat/magasin/${magasinId}`),
        axios.get(`http://localhost:5000/api/bons-commande/magasin/${magasinId}`),
        axios.get(`http://localhost:5000/api/stock/levels/magasin/${magasinId}`)
      ]);

      const pendingRequests = purchaseRequestsRes.data.filter(req => req.status === 'pending');
      const pendingOrders = purchaseOrdersRes.data.filter(order => order.status === 'sent');
      const totalStockValue = stockLevelsRes.data.reduce((acc, item) => acc + (item.quantity_available || 0), 0);

      setStats({
        totalProducts: productsRes.data.length,
        totalCategories: categoriesRes.data.length,
        totalSuppliers: suppliersRes.data.length,
        lowStockAlerts: stockAlertsRes.data.length,
        pendingRequests: pendingRequests.length,
        pendingOrders: pendingOrders.length,
        totalStock: totalStockValue,
        recentActivities: [
          ...pendingRequests.slice(0, 3).map(req => ({
            type: 'purchase_request',
            message: `Nouvelle demande d'achat créée`,
            time: req.created_at
          })),
          ...pendingOrders.slice(0, 3).map(order => ({
            type: 'purchase_order',
            message: `Bon de commande ${order.order_number} envoyé`,
            time: order.created_at
          }))
        ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5)
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.magasin?.id]);

  useEffect(() => {
    if (user?.magasin?.id) {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Produits',
      value: stats.totalProducts,
      icon: Package,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Catégories',
      value: stats.totalCategories,
      icon: Store,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'Fournisseurs',
      value: stats.totalSuppliers,
      icon: Users,
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    {
      title: 'Demandes en Attente',
      value: stats.pendingRequests,
      icon: ShoppingCart,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600'
    },
    {
      title: 'Commandes en Cours',
      value: stats.pendingOrders,
      icon: Activity,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600'
    },
    {
      title: 'Alertes Stock Faible',
      value: stats.lowStockAlerts,
      icon: AlertTriangle,
      color: 'bg-red-500',
      textColor: 'text-red-600'
    },
    {
      title: 'Stock Total',
      value: stats.totalStock,
      icon: DollarSign,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600'
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord</h1>
        <p className="text-gray-600">
          Bienvenue, {user.username} - {user.magasin.name}
        </p>
        <p className="text-sm text-gray-500">
          Rôle: {user.role === 'responsable' ? 'Responsable' : 'Employé'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`${stat.color} rounded-lg p-3 mr-4`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Activités Récentes</h2>
          </div>
          <div className="p-6">
            {stats.recentActivities.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucune activité récente</p>
            ) : (
              <div className="space-y-4">
                {stats.recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.time).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Actions Rapides</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <Package className="h-5 w-5 text-indigo-600" />
                  <span className="text-sm font-medium">Créer un Produit</span>
                </div>
              </button>
              
              <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">Nouvelle Demande d&apos;Achat</span>
                </div>
              </button>
              
              <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium">Ajouter un Fournisseur</span>
                </div>
              </button>
              
              <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium">Voir les Stocks</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;